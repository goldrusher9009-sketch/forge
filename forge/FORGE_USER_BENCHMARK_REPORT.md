# Forge（Pi 内核）资深用户测试报告与可复用 Benchmark

测试日期：2026-09-06。测试对象：当前工作区 `sasaky/forge-commercial-rc` 分支（未提交状态），Pi worker 0.85.1。

本报告只记录**实际跑出来**或**代码里能指出行号**的问题。所有"已验证"条目均在本机真实栈上复现：真实 Pi worker（宿主进程）、真实平台（`NODE_ENV=test`，Node 20）、真实沙箱编排服务与运行时容器（Docker）、真实模型（经本机 `127.0.0.1:8317` OpenAI 兼容代理，模型 `gpt-5.5`）。

---

## 0. 一句话结论

**核心链路是真的能用的**：Pi 主聊天流式输出、沙箱任务（文件/shell/PDF/产物哈希/下载）、Class A/B/C 审批、拒绝后诚实汇报、取消、预算熔断、工作区跨任务持久化、跨用户隔离，全部通过。
**但离"资深用户日常可用"还差三类东西**：(1) 预算/超时的单位和阈值设计让稍长的任务必然失败；(2) 前端把 Pi 聊天入口藏掉了，审批弹窗是盲签；(3) 若干安全边界和计费口径有漏洞。下面按严重度给出。

---

## 1. Benchmark 结果（`scripts/forge-user-benchmark.cjs`，模型 gpt-5.5）

| ID | 场景 | 结果 | 关键指标 |
|---|---|---|---|
| A1 | 登录 + Key 配置 + 模型目录 | PASS | 2 处 UX 缺陷（见 §4） |
| C1 | 纯聊天流式并落库 | PASS | 首 token 1994ms，总 2507ms，2423 tokens |
| C2 | 聊天拒绝宿主 shell/文件 | PASS | 模型诚实说明不可用 |
| C3 | 聊天 http_request 读公网 + 拦截回环地址 | PASS | 6 种内网变形全部拦截（§2 有清单） |
| C4 | 同线程多轮记忆 | PASS | 暗号回传正确 |
| C5 | 流式中途断开 | PASS | 断开后无半截 assistant 消息 |
| S1 | 沙箱：写文件 + 提交产物 + 下载哈希校验 | PASS | 2 次工具调用，$0.0042，13s |
| S2 | 沙箱：shell 真在容器里跑 | PASS | `uid=10001(sandbox)` 非 root，WSL2 内核 |
| S3 | Class B 暂停 → steer → 批准 → 恰好执行一次 | PASS | 重复批准返回 200 幂等；steering 生效 |
| S4 | Class B 拒绝 → 动作未执行 → 诚实汇报 | PASS | "No, the deletion did not happen…" |
| S5 | Class C（sudo）被阻断且任务仍完成 | PASS | `tool_blocked` 事件出现 |
| S6 | 运行中取消 | PASS | 取消到终态 11ms，沙箱销毁 |
| S7 | 工具预算熔断（上限 5） | PASS | 第 5 次后 `SANDBOX_TOOL_BUDGET_EXCEEDED` |
| S8 | 文档工具渲染 PDF 产物 | PASS | 16110 字节，`%PDF-` 头 |
| S9 | 工作区跨 run 持久化 | PASS | 第二个 run 读回 `alpha-9001` |
| X1 | 他人无法读/批/取消我的 run | PASS | 404/404/404 |
| C6 | worker 宕机时的错误面 | 手工验证 | 见 §3.5 |

仓库自带回归：worker `npm test` 24/24 通过；`pi-integration-regression` 8/8 通过；web `pi-streaming-regression` 8/8 通过。

---

## 2. 安全（按严重度）

### S-1 高：主聊天模型网关按"请求字节数"扣 token 预算，长任务必然 429（已复现）
`forge-platform/src/pi-runtime.ts:124-134`。`grant.remaining` 初值是 token 数，却用 `Buffer.byteLength(JSON.stringify(body))` 扣减，且每轮重发全部历史，累计扣减。
复现：一个"顺序写 12 个文件"的沙箱任务，网关 10 次调用请求体 5.8KB→9.8KB 递增，第 10 步后 `PI_RUN_MODEL_BUDGET_EXHAUSTED`，任务 failed。主聊天 `forge_skill`+`forge_plan` 场景第 3 次调用即 429，然后 fallback 到 gpt-4o/gpt-4o-mini 各失败一次，用户看到的是 `PI_PROVIDER_HTTP_400`。
修复：按响应 usage 扣减，请求前只做粗略预留（字节/3.5），不要把历史重复计入。

### S-2 高：聊天 65 秒硬超时掐断 Pi 会话，且不落库、不计费（已复现）
`forge-platform/src/index.ts:3600`。让模型写 4000 字长文，65.1s 后返回 `TIMEOUT`，线程里只剩 user 消息；`usage_logs`/`tokens_used` 均未记录，但上游已经真实消耗。前端自己的超时是 180s，比服务端还长。
同源问题：客户端主动断开（`res.on('close')` abort）同样走不到 `index.ts:4036` 的记账语句，可脚本化白嫖配额。
修复：超时至少匹配 `maxTurns:8`（≥180s）；把 usage 记账移到 `finally` 或按 `usage` 事件增量结算。

### S-3 高：跨租户读取他人 `projects.system_prompt`（已复现）
`index.ts:3565`（创建线程不校验 `project_id` 归属）、`:3690`（读 `system_prompt` 无 `user_id` 条件）。
复现：用户 A 建项目 system_prompt 为"海盗腔"；用户 B 用 A 的 `project_id` 建线程并发消息，回复以"啊哈，船长"开头——A 的私有提示词已注入 B 的会话。模型拒绝复述字面量，但提示词内容（业务规则、口吻）已泄露。
修复：四处 `projects` 查询加 `AND user_id=?`。

### S-4 高：对话接口限流从未生效
`index.ts:5440` 的 `app.use('/api/threads/:id/messages', makeRateLimit(...))` 注册在 `:3575` 的 `app.post` 之后，Express 顺序匹配，永远不执行。`rateLimitMap` 无清理。

### S-5 中：Google 网关路径可被 `%5C..%5C` 穿越
`pi-runtime.ts:111/116/135`。Express 解码 `%5C` 为反斜杠，`[^/]+` 与 `startsWith` 不排斥它，WHATWG URL 又把 `\` 归一化为 `/`，持 grant 的 worker 可用平台密钥打到未授权 Google 端点。未运行时复现，代码逻辑成立。修复：拒绝含 `\`、`..`、`%` 的 suffix，用白名单 verb 重建路径。

### S-6 中：沙箱 run 创建/重试无订阅额度前置校验
`index.ts:13700`、`:13934`。额度耗尽用户仍可连建 25 美元预算的 run。本机验证：admin 账号 `tokensUsed=149225 > tokenLimit=10000` 时聊天仍成功（admin 有豁免，普通用户走 `allowance` 计算，但沙箱路径完全没算）。

### S-7 中：聊天侧 `web_search` + `http_request` 构成无审批的注入→外泄链路
`index.ts:1393-1412`。搜索结果不做不可信标记，`http_request` 无域名白名单，可被搜索结果里的注入文本驱动向攻击者公网地址 GET 外泄上下文。SSRF 防护只拦内网。

### S-8 低（3 条）
- grant token 接受 `?key=` 查询参数，`morgan('combined')` 会把它写进日志（`pi-runtime.ts:106`）。
- `anthropic-beta` 头原样透传（`pi-runtime.ts:139`）。
- 沙箱出口 `FORGE_SANDBOX_EGRESS_ALLOWLIST` 默认为空时 `hostnameAllowed` 返回 true；IPv6 漏 `fec0::/10`、`64:ff9b::/96`、`2002::/16`（`forge-sandbox-orchestrator/src/security.js:38-59`）。当前本机部署就是空白名单。

### 已验证成立的防线
- 聊天 `http_request` SSRF 防护：`localhost:3300`、`0x7f000001`、`[::ffff:127.0.0.1]`、`127.0.0.1:3301`、`169.254.169.254`、`host.docker.internal` 六种全部拦截（非 80/443 端口拦截 + DNS 全记录校验 + 钉死地址 + 拒绝 3xx）。
- 跨用户：线程消息 GET/POST、run details/events/cancel 均 404。
- 审批幂等：重复 approve 返回 200 不重复执行；拒绝后动作不执行；fingerprint 去重。
- 沙箱 shell 非 root（uid 10001），Class C 阻断有效。
- worker：bearer 定时安全比较、8MB 请求上限、并发上限、心跳、abort 清理，错误信息脱敏 Bearer。

---

## 3. 功能缺陷 / 隐患

### 3.1 P0：简单 Agent Run `maxTokens:8192` 硬编码兼任输入预算
`index.ts:13761`。叠加 S-1，提示超过约 7.7KB 第一次请求就 429。另外该路径要求 `AGENT_PASSPORT_REQUIRED`（`:13736`），本机验证返回 409，而 UI 没有创建 passport 的入口——"简化模式"对普通用户实际不可用。

### 3.2 P1：审批恢复前先抛步数超限
`index.ts:13372` 的 `iterations >= 16` 检查在恢复路径无条件执行；暂停在第 16 步时批准即失败，已批准动作永不执行。

### 3.3 P1：自动压缩的 `usage` 事件被当作一次迭代
`runtime.mjs:159` 标了 `source:'compaction'`，`index.ts:13392-13396` 忽略该字段一律 `iterations += 1`，长任务步数被压缩吃掉。

### 3.4 P1：每个流式 token 一次同步 SQLite 事务
`index.ts:13417` 对每个 `text_delta` 调 `appendSandboxEvent`（内含事务）。better-sqlite3 阻塞主线程；`sandbox_events` 被 token 塞满，详情接口只取最近 200 条，真正的工具/审批记录被挤出窗口。本机 S3 的事件 seq 从 27 直接跳到 58，就是被 token 事件占掉的。

### 3.5 P1：worker 宕机/满载时任务直接失败，没有排队和续跑（已复现）
- 5 个并发沙箱 run 对着 `FORGE_PI_MAX_CONCURRENT=4` 的 worker：第 4 个立刻 `PI_RUNTIME_HTTP_429` failed，其余成功。没有排队，用户任务随机失败。聊天和沙箱共享这 4 个槽位。
- 运行中杀掉 worker：run 变 `failed, error=fetch failed`，沙箱销毁；虽然 `piMessages` checkpoint 在库里，也不会续跑。retry 只是新建 run 从头再跑。
- 平台重启：`recoverSandboxRunsAtStartup`（`:13610-13655`）把 `running` 的 Pi 任务一律标 `SANDBOX_RUN_INTERRUPTED_BY_FORGE_RESTART`，与 `FORGE_PI_MIGRATION.md` 第 42 行"恢复已保存 engine:pi 的任务继续 Pi"的承诺不符。
- worker 未就绪时：聊天/建 run/批准/重试都正确返回 503 `PI_RUNTIME_UNAVAILABLE`（验证通过），但 retry/approve/reject 的 503 没有 `message`，前端 `forgeJson` 优先取 `error`，用户只看到内部标识。

### 3.6 P1：费用计算兜底 0.001/1k，Opus 低估约 75 倍
`MODEL_COSTS`（`index.ts:685-707`）键是旧短名，`resolveForgeModel` 解析后的完整 ID 一个都没有；Pi 的 usage 不带 `costUsd`，全部落到兜底。`max_cost_usd` 护栏形同虚设。本机所有 run 的 `cost_usd` 都恰好等于 tokens/1000×0.001。

### 3.7 P1：模型回退循环会重跑工具并重复写 tool_history
`index.ts:4004-4021`。主模型失败回退时 `http_request` 等有副作用的工具真实重发。本机每次 429 后都看到 gpt-4o、gpt-4o-mini 各再打一次网关。

### 3.8 P2
- 子 Agent 与父 Agent 共享 `maxCalls`（`runtime.mjs:57/95`），用了 subagent 的任务很快 `PI_RUN_BUDGET_EXHAUSTED` 硬失败。
- 沙箱引擎丢弃 `skill_loaded`/`subagent_*`/`auto_compaction_*` 事件（`index.ts:13381-13418`），聊天路径却渲染了。
- 运行中不能 steer（`:13969` 只允许 `waiting_approval|paused`，本机验证 409）。
- 兜底产物写入不计入 `tool_calls`（`:13301-13327`）。
- 启动恢复不检查 worker 可用性就拉起 `requested` 任务（`:13638`）。
- `GET /api/keys/openai/models` 直连 `api.openai.com` 失败返回 500 `fetch failed`，耗时 10.7s，前端每次进 Router/Settings 都触发。
- 上游模型一次瞬时 500 直接让沙箱 run `failed`（第二次全量跑 S6 就是这样挂的：`PI_PROVIDER_HTTP_500`，0 token，沙箱销毁）。worker 设 `maxRetries: 0`、`retry.enabled:false`（`runtime.mjs:96/99`），平台侧也没有对 5xx 的重试，只有主聊天有"换模型"回退。沙箱任务应对 5xx/429 做有限退避重试。

---

## 4. 用户体验（真实操作 Web Studio 得出）

1. **Pi 主聊天在侧边栏没有入口。** `id:'workspace'` 的导航项在提交 `2209a51e`（v179 Home Hub）被删掉，`ForgeApp.tsx:27540-27600` 的 27 个导航项里没有聊天。能进 workspace 的只有：OpenRouter 模型卡片点击（`:30319`）、skills 页动作（skills 页本身也没入口）、desktop 页。新用户登录后看到的是"Connect your first tool"，找不到对话框。Playwright 走了 Home/Auto Agent/Smart Router/Direct/Marketplace/AI Tools 都拿不到聊天 textarea。
2. **两层强制向导叠加。** 登录后先弹 3 步"Welcome to Forge"（不填 Organization Name 无法 Next，无跳过），完成后立刻再弹 5 步"biz wizard"。测试账号每次登录都要走一遍（只存 localStorage）。
3. **审批弹窗盲签。** `SandboxAgentConsole.tsx:913/1012-1013` 读 `approval.input`/`approval.summary`，表里只有 `request_summary`。实际截图：摘要是通用文案，详情框是 `{}`。用户批准的是"某个外部变更"，看不到是 `rm notes.txt`。
4. **沙箱控制台默认模型 `gpt-4o` 是自由文本框**（`:939`），本机直接 `PI_PROVIDER_HTTP_400` failed；`/api/agent-runs` 默认 `forge-fast` 映射到 groq 的 llama。建议下拉框只列有 key 的模型。
5. **`GET /api/models` 列出用户没有 key 的 27 个模型**，`/api/models/available` 只有 2 个能用；UI 用的是前者。
6. **`POST /api/keys` 传 `{provider,key}` 返回 200 "Saved keys for: none"**，静默无效；正确字段是 `openai_key`。
7. **产物下载文件名无扩展名**（`Content-Disposition: filename="Report"`），浏览器存成无后缀文件。
8. **每次页面加载 52 个 404**：前端向自身 origin 请求 `/api/integrations/*/status` 和 `/api/forge-tools/catalog`（Next 没这些路由），控制台刷屏。
9. **`/login` 页面登录成功不跳转。** `app/login/page.tsx` 用 `lib/auth.ts` 存 `forge_access_token`，主应用 `ForgeApp.tsx:25101` 读 `forge_user`，两套会话存储互不认识；登录后回到 `/` 仍显示未登录。
10. **`token_budget` 后端算了（`index.ts:3883-3894`）但从未下发前端**，接近配额上限没有任何预警。
11. **Run 详情 `cleanup_error` 字段不存在**（`SandboxAgentConsole.tsx:1007`），沙箱清理失败永远不可见。

---

## 5. 开发/部署摩擦（顺手记录）

- `forge-platform/dist/` 是 8 月 26 日的陈旧产物且被跟踪，`npm start` 会跑到没有 Pi 代码的旧版本；本次第一次起平台就踩了这个坑（网关 404，全部 fallback 失败）。
- `better-sqlite3@9.6.0` 在 Node 24 下源码编译失败（v8 要求 C++20），需要 Node 20 才能拿 prebuilt。Dockerfile 用 node 20 无碍，但本机开发需要显式切版本。
- `forge-sandbox.compose.yml` 的 `FORGE_SANDBOX_EGRESS_ALLOWLIST` 默认空即"全放行"，与 `forge-pi.mcp.compose.yml` 的 `:?` 必填不一致。

---

## 6. 建议修复顺序

1. S-1 + 3.1（预算单位混淆，一处修复）；S-2 + 3.5 计费口径（`finally` 记账）。
2. §4.3 审批盲签（改读 `request_summary`，改动最小影响最大）；S-3 跨租户 prompt；S-4 限流位置。
3. §4.1 把聊天入口放回侧边栏；§4.9 统一会话存储。
4. 3.2/3.3/3.4/3.6/3.7。
5. worker 排队与断点续跑（3.5），让文档承诺成立。

---

## 7. 复用 Benchmark

脚本：`forge-platform/scripts/forge-user-benchmark.cjs`（只走公开 HTTP API，不读 DB、不碰 worker）。

```bash
FORGE_BENCH_BASE=http://127.0.0.1:3300 \
FORGE_BENCH_EMAIL=admin@forge.local FORGE_BENCH_PASSWORD='Admin1234!' \
FORGE_BENCH_MODEL=gpt-5.5 FORGE_BENCH_OPENAI_KEY=sk-... \
node scripts/forge-user-benchmark.cjs [--only S1,S3] [--out bench-results]
```

输出 `forge-bench-<时间>.json` 和 `.md`，可 diff。每个场景记录 pass/fail、耗时、tokens/USD、UX 与安全告警。A1 总是先跑（负责登录）。

本地起栈（本次用的组合）：
1. `forge-sandbox.compose.yml` 起编排服务与 egress（已在跑）。
2. worker：`cd forge-pi-worker && FORGE_PI_WORKER_TOKEN=<32+字符> PORT=8791 HOST=127.0.0.1 node --import tsx src/server.mjs`。
3. 平台：Node 20 + `npm ci` + 重新 `esbuild ... --format=cjs`，`NODE_ENV=test` 并设置 `FORGE_PI_TEST_MODEL_URL`/`FORGE_SANDBOX_TEST_OPENAI_CHAT_URL` 指向本机 OpenAI 兼容代理（只允许 loopback）。
4. 前端：`NEXT_PUBLIC_API_BASE_URL=http://localhost:3300/api npx next dev -p 3001`。

UI 自动化探针（Playwright）在 `.omc/bench-tools/ui-*.mjs`，截图在 `.omc/bench-tools/shots/`。

场景扩展建议（本次未覆盖）：Anthropic/Gemini 原生协议路径、MCP 只读工具、Google Drive 写回、多用户并发计费一致性、平台重启续跑。
