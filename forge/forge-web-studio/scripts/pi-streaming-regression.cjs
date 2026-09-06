const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const { createRequire } = require('node:module');
const { resolve, join } = require('node:path');
const root = resolve(__dirname, '..');
const requireWeb = createRequire(join(root, 'package.json'));
const ts = requireWeb('typescript');
const path = join(root, 'app/components/ForgeApp.tsx');
const source = fs.readFileSync(path, 'utf8');
const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function named(name) {
  const found = [];
  function visit(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name?.getText(ast) === name) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(found.length, 1, 'Unique source declaration: ' + name);
  return found[0];
}
function compile(text) {
  return ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true }).outputText;
}
const sseDeclaration = named('apiFetchSSE').getText(ast);
function sse(payloads) {
  const stream = new ReadableStream({ start(controller) { for (const payload of payloads) controller.enqueue(payload); controller.close(); } });
  const context = {
    fetch: async () => new Response(stream, { headers: { 'content-type': 'text/event-stream' } }),
    Response, AbortSignal, TextDecoder, API: 'https://fixture.invalid/api',
  };
  return vm.runInNewContext(compile(sseDeclaration + '\napiFetchSSE;'), context);
}
const encode = value => new TextEncoder().encode(value);
test('the real SSE parser delivers split UTF-8 tokens and a result without a trailing newline', async () => {
  const bytes = encode(': heartbeat\n\ndata:{"type":"token","delta":"你好🚀"}\r\n\r\ndata: {"type":"result","payload":{"data":{"content":"final"}}}');
  const segments = [];
  for (let index = 0; index < bytes.length; index += 3) segments.push(bytes.slice(index, index + 3));
  const events = [];
  const result = await sse(segments)('/threads/fixture/messages', {}, undefined, event => events.push(event));
  assert.equal(events[0].delta, '你好🚀');
  assert.equal(result.data.content, 'final');
});
test('the real SSE parser surfaces errors and never treats a partial-only stream as success', async () => {
  const events = [];
  await assert.rejects(sse([encode('data: {"type":"token","delta":"partial"}\n\ndata: {"type":"error","message":"worker failed"}\n\n')])('/test', {}, undefined, event => events.push(event)), /worker failed/);
  assert.equal(events[0].delta, 'partial');
  await assert.rejects(sse([encode('data: {"type":"token","delta":"partial"}\n\n')])('/test'), /ended before completion/);
});

const handler = named('handleStreamEvent').getText(ast);
const apply = named('applyResp');
let outer = apply.parent;
while (outer && !ts.isTryStatement(outer)) outer = outer.parent;
assert.ok(outer?.catchClause && outer.finallyBlock);
const variablesStart = source.indexOf("    const liveMessageId = 'tmp-stream-'");
const variablesEnd = source.indexOf('    try {', variablesStart);
const liveVariables = source.slice(variablesStart, variablesEnd);
function ui() {
  return vm.runInNewContext(compile(`(() => {
    let messages = [{id:'tmp-u', role:'user', content:'request'}], steps=[], toolCalls=[], timerId=0;
    const timers = new Map();
    const setTimeout = fn => { timers.set(++timerId,fn); return timerId; };
    const clearTimeout = id => timers.delete(id);
    const clearInterval = () => {};
    const setMessages = update => { messages = update(messages); };
    const setLiveToolCalls = update => { toolCalls = update(toolCalls); };
    const addAgentStep = (icon,text) => steps.push({icon,text});
    const loadFolderFiles = () => {};
    const currentThread = {id:'thread-fixture'}, abortCtrl = new AbortController();
    let threadId=currentThread.id, userContent='request', cleanModel='fixture';
    const savedProviders={}, setSelectedModel=()=>{}, openRouterModels=[];
    const safetyTimer=0, aiTimerRef={current:null}, agentStepsRef={current:[]}, sendAbortRef={current:abortCtrl};
    let sending=true, typing=true;
    const setSending=value=>sending=value, setTyping=value=>typing=value, setLastThinkingSteps=()=>{};
    const pendingMessage='', setPendingMessage=()=>{}, setInput=()=>{};
    ${liveVariables}
    const ${handler};
    const ${apply.getText(ast)};
    function fail(e) ${outer.catchClause.block.getText(ast)}
    function cleanup() ${outer.finallyBlock.getText(ast)}
    return { emit:handleStreamEvent, apply:applyResp, fail, cleanup, abort:()=>abortCtrl.abort(),
      flush:()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}},
      snapshot:()=>({messages,steps,toolCalls,sending,typing,timers:timers.size}) };
  })()`), { AbortController });
}
test('tokens update one temporary assistant draft and the stored final response replaces it', () => {
  const screen=ui();
  screen.emit({type:'token',delta:'first '}); screen.flush();
  screen.emit({type:'token',delta:'second'}); screen.flush();
  let state=screen.snapshot();
  assert.equal(state.messages.filter(message=>message.role==='assistant').length,1);
  assert.ok(state.messages.at(-1).content.includes('first second'));
  screen.emit({type:'token',delta:' queued'});
  screen.apply({success:true,data:{id:'stored-final',content:'Authoritative final answer.'}});
  screen.flush(); state=screen.snapshot();
  assert.equal(state.messages.filter(message=>message.role==='assistant').length,1);
  assert.equal(state.messages.at(-1).id,'stored-final');
  assert.equal(state.messages.at(-1).content,'Authoritative final answer.');
  assert.equal(state.timers,0);
});
test('tool turns and child output cannot be mixed into the final assistant draft', () => {
  const screen=ui();
  screen.emit({type:'token',delta:'I will inspect the source.'});screen.flush();
  screen.emit({type:'tool_call',tool:'sandbox_file',args:{operation:'read'},result:'RAW TOOL OUTPUT'});
  assert.equal(screen.snapshot().messages.filter(message=>message.role==='assistant').length,0);
  screen.emit({type:'subagent_event',event:{type:'text_delta',delta:'CHILD TEXT'}});
  screen.emit({type:'text_delta',childId:'child',delta:'CHILD TEXT'});
  screen.emit({type:'token',delta:'Verified result.'});screen.flush();
  const content=screen.snapshot().messages.at(-1).content;
  assert.ok(content.includes('Verified result.'));
  assert.ok(!content.includes('I will')&&!content.includes('RAW TOOL')&&!content.includes('CHILD TEXT'));
});
test('skills, declared plan progress, child tasks and compaction use the existing step tracker', () => {
  const screen=ui();
  screen.emit({type:'skill_loaded',name:'forge-research'});
  screen.emit({type:'plan_updated',steps:[{status:'completed'},{status:'in_progress'}]});
  screen.emit({type:'subagent_start',task:'Read sources'});
  screen.emit({type:'subagent_end'});
  screen.emit({type:'compaction_start'});
  screen.emit({type:'compaction_end'});
  const state=screen.snapshot();
  assert.equal(state.steps.length,6);
  assert.ok(state.steps[1].text.includes('1/2 steps marked complete'));
  assert.equal(state.messages.filter(message=>message.role==='assistant').length,0);
});
test('cancellation retains a labelled partial draft and clears loading and pending paint', () => {
  const screen=ui();
  screen.emit({type:'token',delta:'Useful partial response'});
  screen.abort();screen.fail(new Error('The operation was aborted'));screen.cleanup();screen.flush();
  const state=screen.snapshot();
  assert.equal(state.messages.filter(message=>message.role==='assistant').length,1);
  assert.ok(state.messages.at(-1).content.includes('partial draft'));
  assert.ok(state.messages.at(-1).content.includes('Useful partial response'));
  assert.ok(state.messages.at(-1).content.includes('Request cancelled.'));
  assert.equal(state.sending,false);assert.equal(state.typing,false);assert.equal(state.timers,0);
});
test('stream failures preserve available text and surface a readable error', () => {
  const screen=ui();screen.emit({type:'token',delta:'Partial text'});screen.flush();
  screen.fail(new Error('Connection failed'));screen.cleanup();
  const state=screen.snapshot();
  assert.equal(state.messages.filter(message=>message.role==='assistant').length,1);
  assert.ok(state.messages.at(-1).content.includes('Partial text'));
  assert.ok(state.messages.at(-1).content.includes('Connection failed'));
  assert.equal(state.sending,false);assert.equal(state.typing,false);
});
test('the complete TSX has no TypeScript syntax diagnostics', () => {
  assert.equal(ast.parseDiagnostics.length,0);
});
