# Pi 引擎并入生产线（sasaky/forge-pi-on-gdl）

更新：2026-09-07。分支 `sasaky/forge-pi-on-gdl` = 旧生产线 `sasaky/forge-google-drive-launch`（8 月 31 日）+ Pi 引擎提交（cherry-pick 自 `sasaky/forge-commercial-rc`）。

## 1. 为什么这样合

旧线（Google Drive 私测候选）和 Pi 线（`sasaky/forge-commercial-rc`）都从 7 月的 `63035a4b` 分出，旧线上有 79 个商业化、沙箱加固、Drive、运维提交，Pi 线上有 4 个引擎提交。把 4 个引擎提交 cherry-pick 到旧线上，冲突面比反向合并小一个数量级（`index.ts` 6 处，`ForgeApp.tsx` 93 处但大多是机械的变量重命名）。

## 2. 旧线功能清单（全部保留在本分支）

| 领域 | 内容 | 位置 |
|---|---|---|
| Google Drive | OAuth+PKCE（仅 `drive.file` 范围）、Picker、最多 20 个选择、10MB 导入上限、版本去重、导入经内容策略、产物写回需人工批准且只 `files.create`、`appProperties` 反查、每日 4 点清理 | `index.ts` `/api/google-drive/*`，`SandboxAgentConsole.tsx` Drive 面板，`app/privacy` `app/terms` `app/legal` |
| 商业化 | `BILLING_REQUIRED` fail-closed 启动、`PLAN_LIMITS`、预付费余额与超额扣费（`PREPAID_OVERAGE_USD_PER_MILLION_TOKENS`）、`getUserKey(..., allowPlatform)` BYOK 闸门、消息插入前的 token 准入检查、日志脱敏、Apptopia/Minera 三产品闭环 | `index.ts:50-90, 921-940, 1030, 4370-4390` |
| 沙箱加固 | 全局/租户并发准入、工具并发限制、内容策略（可执行签名、zip bomb、宏）、入站压缩包检查、dind 隔离拓扑、HMAC nonce 防重放 | `forge-sandbox-orchestrator/src/*`，`forge-vps-isolated.compose.yml` |
| 自治/手机 | 加固版 `/api/autonomous`（预算、步数、工具白名单）、`/api/phone-agent/*`（plan-only、一次性执行令牌） | `index.ts:34880-35840` |
| 运维 | `sqlite-backup.ts` 在线备份+恢复演练、监控 timer、refresh token `jti`、Vercel 同源 `/api` 代理（`_forgeProxy.ts`）、Cloudflare 隧道边缘 | `scripts/`, `app/api/_forgeProxy.ts` |
| 工具波次 | web-search、image-gen、metrics、translate、extract、code-assist、write-assist、batch、prompts、compare 等 | `index.ts:247837+` |

## 3. Pi 线带来的（叠加在上面）

模型网关（token 预算、Google 路径校验、beta 头白名单）、Pi worker 与子 Agent 独立预算、聊天空闲看门狗、断连/超时计费、跨租户 project 隔离、路由级限流、费用表、沙箱压缩不计步、token 批量落库、审批恢复豁免、重启续跑、运行中 steer、前端 Chat 入口 / 审批卡片 / 模型下拉 / 会话统一等。详见 `FORGE_USER_BENCHMARK_REPORT.md`。

## 4. 合并时的关键决策

- **计费单点**：聊天成功与失败都走 `settleUsage`，其内部是旧线的事务（usage_logs + token_usage + subscriptions + 预付费超额扣费），Pi 线的估算计费只是给它喂数。
- **准入在前**：旧线"被预算拒绝的消息不得进历史"的顺序保留；因此用户消息在模型轮之后才落库，Pi 引擎改为通过 `input` 显式接收待发消息（提交 `ac30c42e`）。
- **版本号**以旧线 `v1280.00` 为准。
- **前端**保留旧线的同源代理（`BACKEND = ''`）；Pi 线的 `${API}` 改动全部让位。
- **测试**：旧线的 mock 模型只支持非流式，Pi 引擎只发流式请求。三个回归脚本的 mock 增加了流式分支、数组 content 解析、原生 tool 消息识别（提交 `45599343`、`0af63596`），未改任何断言语义。

## 5. 验证结果（本分支）

| 套件 | 结果 |
|---|---|
| `forge-user-benchmark.cjs`（真实 worker + 真实沙箱） | 16/16 通过，C6 需人工 |
| `startup-regression.cjs`（含商业化 BYOK/预付费用例） | 10/10 |
| `pi-integration-regression.cjs` | 8/8 |
| `sandbox-integrated-regression.cjs`（真实编排器，四种取消路径） | 1/1 |
| `google-drive-regression.cjs` | 1/1 |
| `sandbox-recovery-regression.cjs` | 1/1 |
| `sqlite-backup-regression.cjs` | 通过（含恢复演练） |
| `pi-provider-gateway-regression.cjs` | 11/11（需 Node 24） |
| worker `npm test` | 24/24 |
| web `pi-streaming-regression.cjs` | 8/8 |
| `next build` | 通过 |

## 6. 生产环境

- 后端：VPS `135.148.52.149`，`/opt/forge-pi`，`https://forge-api.135-148-52-149.sslip.io`（`/ready` 报 `v1280.00`、`billing: disabled`）。
- 前端：Vercel `forge-sand-two.vercel.app`。
- 旧栈 `forge-private-isolated`（端口 3401）仍在同机运行，未动；两套栈用各自的数据库卷。

## 7. 2026-09-07 决策与落地

| 事项 | 决定 | 落地 |
|---|---|---|
| 数据库 | 迁移旧栈数据，复用旧栈 `CREDENTIAL_ENCRYPTION_KEY` | 通过 better-sqlite3 backup API 做 WAL 一致快照，装入 `forge-pi-platform-data` 卷；新栈原库和旧库快照都留在 `/opt/forge-pi/migration/`（`forge-new-*.db`、`forge-old-*.db`）。新栈当时没有任何加密行，换密钥零损失。 |
| 前端入口 | 采用旧线设计的 Vercel 同源 `/api` 代理 + 网关密钥 | `forge-vps.compose.yml` 新增 `forge-control-plane-gateway`（Caddy，`forge-control-plane-tunnel.Caddyfile`），平台端口不再发布；nginx 把 `forge-api.135-148-52-149.sslip.io` 转到网关；无密钥请求 404。Vercel 生产环境改为 `FORGE_CONTROL_PLANE_API_URL` + `FORGE_CONTROL_PLANE_GATEWAY_SECRET`（Sensitive），删除了 `NEXT_PUBLIC_API_*`。前端 1580 处相对路径 fetch 自然生效。 |
| `BILLING_REQUIRED` | **已开启（2026-09-08）** | Stripe live 账号 `acct_1TGr8N…`（与 Apptopia/NEXUS 同一账号）。新建三个订阅价格 `forge_starter` $29、`forge_pro` $99、`forge_agency` $299/月（lookup_key 幂等）；webhook 端点 `we_1UDMKL…` 指向 `/api/billing/webhook`，Caddy 按 `Stripe-Signature` 头放行，平台用 endpoint secret 验签。已实测：真实 Checkout 会话创建、签名事件激活 starter（500k tokens + $20 credits）、错误签名 400。平台模型 Key：OpenRouter（来自 nexus-platform，余额约 $5.5，需充值）。 |
| 宿主 exec 接口 | 下线 | `/api/sandbox/run`、`/api/sandbox/ask` 返回 410 `HOST_EXEC_RETIRED`，指向沙箱 Agent Run。 |

仍待做（非阻塞）：Drive 面板与 run 控制台仍在同一文件；前端状态集合仍是手抄字面量。

## 7.1 2026-09-08 生产验收与运维

- 生产 benchmark（经 Vercel 代理，模型 `anthropic/claude-sonnet-4.6` 走平台 OpenRouter Key）：16/16 通过，C6 需人工。首 token 1.7s，沙箱单任务 $0.04-0.06。
- 首轮 S7-S9 因编排器默认"每租户 1 个活动沙箱"在连续任务间拒绝准入而失败；Pi 栈现在默认 4 全局 / 3 每租户 / 2 并发工具（compose 可覆盖）。
- 运维：`deploy/vps/ops/` 的备份（每日 03:15 UTC，含隔离恢复演练与 5 表计数比对）和监控（5 分钟，容器 state/health/RestartCount、网关存活、未授权 404、备份年龄 ≤36h、磁盘 ≥10GiB）已作为 systemd timer 安装在 VPS，两者均 PASS。安装：`sudo bash deploy/vps/ops/install-forge-pi-operations.sh`。
- `/api/models/available` 改为与执行路径相同的 Key 解析，`platform_models` 种子改为增量。

## 8. 重部署

```bash
cd forge && tar --exclude=node_modules --exclude=.next --exclude=dist --exclude=.omc --exclude=.git \
  -czf /tmp/forge-sync.tgz forge-platform forge-pi-worker forge-sandbox-orchestrator forge-sandbox-runtime forge-vps.compose.yml deploy
scp /tmp/forge-sync.tgz ubuntu@135.148.52.149:/opt/forge-pi/
ssh ubuntu@135.148.52.149 'cd /opt/forge-pi && tar xzf forge-sync.tgz && rm forge-sync.tgz && sudo bash deploy/vps/deploy.sh'
```
