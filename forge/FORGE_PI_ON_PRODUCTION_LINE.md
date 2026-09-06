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

## 7. 仍未迁移 / 需要决策

1. **数据库**：本栈是新库。旧栈的用户、Key、Drive 授权、历史在 `forge-private-candidate-platform-data` 卷里；迁移需要把 `forge.db` 复制过来并复用旧栈的 `CREDENTIAL_ENCRYPTION_KEY`（否则已存的模型 Key 与 Drive token 解不开）。
2. **前端入口方式**：旧线设计是 Vercel 同源 `/api` 经 Cloudflare 隧道到内网 Caddy，但隧道令牌从未落盘，等于从没通过这条路走过。本栈用 nginx 直接暴露后端 + `NEXT_PUBLIC_API_BASE_URL`。两条路只能选一条；同源代理的 `FORGE_CONTROL_PLANE_*` 变量在 Vercel 上未配置。
3. **`BILLING_REQUIRED`**：本栈未开启（`billing: disabled`），Stripe 变量未配。开启前需要 Stripe 密钥与价格 ID。
4. **旧线遗留的宿主 exec 接口** `/api/sandbox/run`、`/api/sandbox/ask`（`index.ts:5622/5652`）是无隔离的 RCE 面，两条线都有；建议下线，需产品确认。
5. **Drive 面板与 run 控制台仍在同一个文件**，前端状态集合仍是手抄字面量而非 import 自 `sandbox-contract.ts`（旧线遗留，本次未动）。
6. 各集成面板内约 1580 处 `fetch('/api/...')` 在旧线上因同源代理而工作，在本栈的直连模式下会 404，除非 Vercel 配置同源代理。

## 8. 重部署

```bash
cd forge && tar --exclude=node_modules --exclude=.next --exclude=dist --exclude=.omc --exclude=.git \
  -czf /tmp/forge-sync.tgz forge-platform forge-pi-worker forge-sandbox-orchestrator forge-sandbox-runtime forge-vps.compose.yml deploy
scp /tmp/forge-sync.tgz ubuntu@135.148.52.149:/opt/forge-pi/
ssh ubuntu@135.148.52.149 'cd /opt/forge-pi && tar xzf forge-sync.tgz && rm forge-sync.tgz && sudo bash deploy/vps/deploy.sh'
```
