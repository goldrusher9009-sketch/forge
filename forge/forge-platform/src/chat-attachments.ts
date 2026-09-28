import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

/** Documents are prepared without creating library files or changing an Agent
 * release. The composer sends the complete returned text with the user's task. */
export const CHAT_DOCUMENT_LIMITS = { bytes: 5 * 1024 * 1024, chars: 80000, pages: 200, timeoutMs: 15000, ocrPages: 20, totalTimeoutMs: 60000 };
export class ChatAttachmentError extends Error {
  constructor(public code: string, public status = 422) { super(code); }
}
const fail = (code: string, status = 422): never => { throw new ChatAttachmentError(code, status); };
const textName = /(?:\.(?:txt|md|markdown|csv|tsv|json|jsonl|js|jsx|ts|tsx|css|scss|html|xml|py|java|c|cpp|h|go|rs|rb|php|sh|yml|yaml|toml|sql|log|vue|svelte|astro)|(?:^|\/)(?:Dockerfile|\.gitignore))$/i;

export type PreparedChatDocument = {
  name: string; content: string; sha256: string; bytes: number; chars: number;
  format: 'text' | 'pdf'; pages?: number; notice?: 'PDF_TEXT_ONLY' | 'PDF_OCR'; ocrPages?: number; ocrEmptyPages?: number[];
};

export type ChatImage = { type:'image'; data:string; mimeType:string };
/** Only inline bytes are accepted. A URL must never turn an attachment into a
 * server-side fetch. Keep the native session below its persisted byte ceiling. */
export function validateChatImages(input:any):ChatImage[] {
  if(input===undefined)return [];
  if(!Array.isArray(input)||input.length>4)fail('CHAT_IMAGES_INVALID',400);
  let total=0;
  return input.map((item:any)=>{
    if(!item||item.type!=='image'||typeof item.data!=='string'||item.data.length>Math.ceil(2*1024*1024/3)*4||item.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(item.data))fail('CHAT_IMAGES_INVALID',400);
    const bytes=Buffer.from(item.data,'base64');total+=bytes.length;
    if(total>2*1024*1024)fail('CHAT_IMAGES_TOO_LARGE',413);
    if(!bytes.length||bytes.toString('base64')!==item.data)fail('CHAT_IMAGES_INVALID',400);
    const mime=item.mediaType;
    const valid=mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
      mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
      mime==='image/webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':
      mime==='image/gif'?['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()):false;
    if(!valid)fail('CHAT_IMAGES_INVALID',400);
    return {type:'image',data:item.data,mimeType:mime};
  });
}

function validate(input: any) {
  if (!input || typeof input.filename !== 'string' || !input.filename.trim() || input.filename.length > 240 || /[\x00-\x1f\x7f\\]/.test(input.filename)
    || input.filename.split('/').some((part: string) => !part || part === '.' || part === '..')) fail('CHAT_ATTACHMENT_INVALID_NAME', 400);
  if (typeof input.content !== 'string' || input.content.length > Math.ceil(CHAT_DOCUMENT_LIMITS.bytes / 3) * 4) fail('CHAT_ATTACHMENT_TOO_LARGE', 413);
  if (!input.content || input.content.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.content)) fail('CHAT_ATTACHMENT_INVALID_ENCODING', 400);
  const bytes = Buffer.from(input.content, 'base64');
  if (bytes.toString('base64') !== input.content) fail('CHAT_ATTACHMENT_INVALID_ENCODING', 400);
  if (bytes.length > CHAT_DOCUMENT_LIMITS.bytes) fail('CHAT_ATTACHMENT_TOO_LARGE', 413);
  const mime = typeof input.mime_type === 'string' ? input.mime_type.toLowerCase() : '';
  const pdf = bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if ((/\.pdf$/i.test(input.filename) || mime === 'application/pdf') && !pdf) fail('CHAT_ATTACHMENT_INVALID_PDF');
  if (!pdf && !textName.test(input.filename) && !/^text\/[a-z0-9.+-]+$/.test(mime) && !['application/json', 'application/xml'].includes(mime)) fail('CHAT_ATTACHMENT_UNSUPPORTED');
  return { bytes, pdf, name: input.filename.trim() };
}

function completeText(content: string) {
  if (!content.trim()) fail('CHAT_ATTACHMENT_NO_TEXT');
  if (content.length > CHAT_DOCUMENT_LIMITS.chars) fail('CHAT_ATTACHMENT_TEXT_TOO_LONG', 413);
  if (/[\x00-\x08\x0b\x0e-\x1f]/.test(content)) fail('CHAT_ATTACHMENT_BINARY_TEXT');
  return content;
}

// pdf-parse suppresses page-render failures. Track them explicitly so a damaged
// page or an exceeded limit cannot be reported as a successful full extraction.
async function parsePdf(bytes: Buffer) {
  const pdfParse = require('pdf-parse/lib/pdf-parse.js');
  const ops = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js').OPS;
  const imageOps = new Set(Object.keys(ops).filter(key => /^paint.*Image|^paintJpeg/.test(key)).map(key => ops[key]));
  const pageTexts: Array<{page: number; text: string; needsOcr: boolean}> = [];
  let rendered = 0, chars = 0, failure: string | undefined;
  // An exact Uint8Array avoids pdf.js interpreting a pooled Node Buffer's
  // backing allocation as PDF bytes (which produces spurious xref errors).
  const parsed = await pdfParse(new Uint8Array(bytes), { max: CHAT_DOCUMENT_LIMITS.pages, pagerender: async (page: any) => {
    rendered++;
    if (failure) return '';
    try {
      const data = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      let text = '', lastY: number | undefined;
      for (const item of data.items) {
        text += (lastY !== undefined && lastY !== item.transform[5] ? '\n' : '') + item.str;
        lastY = item.transform[5];
        if (chars + text.length + 2 > CHAT_DOCUMENT_LIMITS.chars) { failure = 'CHAT_ATTACHMENT_TEXT_TOO_LONG'; return ''; }
      }
      chars += text.length + 2;
      const operators = await page.getOperatorList();
      pageTexts.push({page: page.pageNumber, text, needsOcr: !text.trim() || operators.fnArray.some((op: number) => imageOps.has(op))});
      return text;
    } catch { failure = 'CHAT_ATTACHMENT_PDF_FAILED'; return ''; }
  }});
  if (parsed.numpages > CHAT_DOCUMENT_LIMITS.pages) fail('CHAT_ATTACHMENT_TOO_MANY_PAGES', 413);
  if (failure) fail(failure, failure === 'CHAT_ATTACHMENT_TEXT_TOO_LONG' ? 413 : 422);
  if (rendered !== parsed.numpages) fail('CHAT_ATTACHMENT_PDF_FAILED');
  return { content: parsed.text, pages: parsed.numpages, pageTexts };
}

if (!isMainThread && workerData?.forgeChatPdf === true) {
  parsePdf(Buffer.from(workerData.bytes)).then(data => parentPort!.postMessage({ data })).catch(error => {
    parentPort!.postMessage({ error: error instanceof ChatAttachmentError ? error.code : 'CHAT_ATTACHMENT_PDF_FAILED', status: error.status || 422 });
  });
}

type PdfText = {content: string; pages: number; pageTexts: Array<{page: number; text: string; needsOcr: boolean}>};
function cancelled(signal?: AbortSignal) { if (signal?.aborted) fail('CHAT_ATTACHMENT_CANCELLED', 499); }
async function isolatedPdf(bytes: Buffer, signal?: AbortSignal): Promise<PdfText> {
  cancelled(signal);
  const worker = new Worker(__filename, { workerData: { forgeChatPdf: true, bytes }, resourceLimits: { maxOldGenerationSizeMb: 128 } });
  try {
    return await new Promise<PdfText>((resolve, reject) => {
      const finish = (error?: Error, data?: PdfText) => { clearTimeout(timer); signal?.removeEventListener('abort', abort); error ? reject(error) : resolve(data!); };
      const abort = () => finish(new ChatAttachmentError('CHAT_ATTACHMENT_CANCELLED', 499));
      const timer = setTimeout(() => finish(new ChatAttachmentError('CHAT_ATTACHMENT_TIMEOUT', 408)), CHAT_DOCUMENT_LIMITS.timeoutMs);
      signal?.addEventListener('abort', abort, {once: true});
      if (signal?.aborted) { abort(); return; }
      worker.once('message', result => result.error ? finish(new ChatAttachmentError(result.error, result.status)) : finish(undefined, result.data));
      worker.once('error', () => finish(new ChatAttachmentError('CHAT_ATTACHMENT_PDF_FAILED')));
      worker.once('exit', () => finish(new ChatAttachmentError('CHAT_ATTACHMENT_PDF_FAILED')));
    });
  } finally { await worker.terminate(); }
}

/** Native parsing stays off the event loop. Fixed commands receive only our
 * temporary paths, never a user filename. Kill before resolving on abort so a
 * released admission slot cannot leave an OCR process running in the background. */
async function pdfCommand(command: string, args: string[], deadline: number, signal?: AbortSignal): Promise<string> {
  cancelled(signal);
  const remaining = deadline - Date.now();
  if (remaining <= 0) fail('CHAT_ATTACHMENT_TIMEOUT', 408);
  return new Promise((resolve, reject) => {
    let aborted = false;
    const limited = process.platform === 'linux';
    const child = execFile(limited ? 'prlimit' : command, limited ? ['--as=805306368', '--cpu=15', '--', command, ...args] : args, {
      encoding: 'utf8', windowsHide: true, timeout: Math.min(15000, remaining), killSignal: 'SIGKILL',
      maxBuffer: CHAT_DOCUMENT_LIMITS.chars * 4 + 4096,
      env: {...process.env, OMP_THREAD_LIMIT: '1'},
    }, (error: any, stdout) => {
      signal?.removeEventListener('abort', abort);
      if (aborted) reject(new ChatAttachmentError('CHAT_ATTACHMENT_CANCELLED', 499));
      else if (error?.code === 'ENOENT' || error?.code === 127) reject(new ChatAttachmentError('CHAT_ATTACHMENT_OCR_UNAVAILABLE', 503));
      else if (error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') reject(new ChatAttachmentError('CHAT_ATTACHMENT_TEXT_TOO_LONG', 413));
      else if (error?.killed || error?.signal === 'SIGXCPU') reject(new ChatAttachmentError('CHAT_ATTACHMENT_TIMEOUT', 408));
      else if (error) reject(new ChatAttachmentError('CHAT_ATTACHMENT_OCR_FAILED'));
      else resolve(stdout);
    });
    const abort = () => { aborted = true; child.kill('SIGKILL'); };
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) abort();
  });
}

async function recognizePdf(bytes: Buffer, parsed: PdfText, deadline: number, signal?: AbortSignal) {
  const selected = parsed.pageTexts.filter(page => page.needsOcr);
  if (!selected.length) return {content: completeText(parsed.content), pages: parsed.pages, notice: 'PDF_TEXT_ONLY' as const};
  if (selected.length > CHAT_DOCUMENT_LIMITS.ocrPages) fail('CHAT_ATTACHMENT_OCR_TOO_MANY_PAGES', 413);
  cancelled(signal);
  const directory = await mkdtemp(join(tmpdir(), 'forge-pdf-'));
  try {
    const input = join(directory, 'input.pdf'), output = join(directory, 'page');
    await writeFile(input, bytes, {mode: 0o600});
    const parts: string[] = [], empty: number[] = [];
    let chars = 0, hasText = false;
    for (const page of parsed.pageTexts) {
      cancelled(signal);
      let text = page.text;
      if (page.needsOcr) {
        await pdfCommand('pdftoppm', ['-f', String(page.page), '-l', String(page.page), '-singlefile', '-r', '300', '-scale-to', '2400', '-gray', '-png', input, output], deadline, signal);
        // Local language data only: documents never go to an OCR service.
        const recognized = (await pdfCommand('tesseract', [output + '.png', 'stdout', '-l', 'eng+chi_sim+chi_tra', '--psm', '3', '--dpi', '300'], deadline, signal)).trim();
        if (!recognized) empty.push(page.page);
        text = (text.trim() ? '[Original PDF text]\n' + text + '\n\n' : '')
          + '[OCR text - may contain recognition errors; verify numbers, dates and names against the original]\n'
          + (recognized || '[No text recognized on this page. It may contain graphics or unreadable text; review the original.]');
        hasText ||= Boolean(page.text.trim() || recognized);
      } else hasText ||= Boolean(text.trim());
      const section = '[Page ' + page.page + ']\n' + text;
      chars += section.length + (parts.length ? 2 : 0);
      if (chars > CHAT_DOCUMENT_LIMITS.chars) fail('CHAT_ATTACHMENT_TEXT_TOO_LONG', 413);
      parts.push(section);
    }
    if (!hasText) fail('CHAT_ATTACHMENT_NO_TEXT');
    return {content: completeText(parts.join('\n\n')), pages: parsed.pages, notice: 'PDF_OCR' as const, ocrPages: selected.length, ocrEmptyPages: empty};
  } finally { await rm(directory, {recursive: true, force: true}); }
}

let activePdfJobs = 0;
async function preparePdf(bytes: Buffer, signal?: AbortSignal, ocr = true) {
  cancelled(signal);
  if (activePdfJobs >= 2) fail('CHAT_ATTACHMENT_BUSY', 429);
  activePdfJobs++;
  const deadline = Date.now() + CHAT_DOCUMENT_LIMITS.totalTimeoutMs;
  try {
    const parsed = await isolatedPdf(bytes, signal);
    // Legacy clients describe PDF attachments as text-layer-only. Do not
    // silently put OCR into that contract, including after a website rollback.
    if (!ocr) return {content: completeText(parsed.content), pages: parsed.pages, notice: 'PDF_TEXT_ONLY' as const};
    return await recognizePdf(bytes, parsed, deadline, signal);
  }
  finally { activePdfJobs--; }
}

export async function prepareChatDocument(input: any, options: {signal?: AbortSignal; ocr?: boolean} = {}): Promise<PreparedChatDocument> {
  const { bytes, pdf, name } = validate(input);
  const identity = { name, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
  if (pdf) {
    const result = await preparePdf(bytes, options.signal, options.ocr !== false);
    return { ...identity, ...result, chars: result.content.length, format: 'pdf' };
  }
  let content: string;
  try {
    const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
    content = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch { fail('CHAT_ATTACHMENT_TEXT_ENCODING'); }
  content = completeText(content!);
  return { ...identity, content, chars: content.length, format: 'text' };
}

export function registerChatAttachmentRoutes(app: any, auth: any, rateLimit: any) {
  app.post('/api/chat/attachments/prepare', auth, rateLimit, async (req: any, res: any) => {
    res.set('Cache-Control', 'no-store');
    const controller = new AbortController();
    const close = () => { if (!res.writableEnded) controller.abort(); };
    res.once('close', close);
    try { const data = await prepareChatDocument(req.body, {signal: controller.signal, ocr: req.body?.ocr === true}); if (!res.destroyed) res.json({ success: true, data }); }
    catch (error) { if (!res.destroyed) res.status(error instanceof ChatAttachmentError ? error.status : 500).json({ success: false, error: error instanceof ChatAttachmentError ? error.code : 'CHAT_ATTACHMENT_FAILED' }); }
    finally { res.removeListener('close', close); }
  });
}
