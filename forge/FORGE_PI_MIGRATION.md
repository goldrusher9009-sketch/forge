# Forge → Pi 引擎迁移与本地运行手册

更新日期：2026-09-06。本文描述当前工作区实现及本地验证结果；不代表已提交、已部署或已完成生产数据迁移。

## 1. 当前接入方式

Forge 保留用户、API、鉴权、模型凭证、任务状态、审批、账本和沙箱执行边界，把智能体会话和模型工具循环交给独立的 Pi worker。当前实际调用的是 `@earendil-works/pi-coding-agent` SDK，不是模拟 Pi 行为的同名包装。

```text
Forge Web / API 客户端
        │ 原有登录、SSE、任务和审批 API
        ▼
forge-platform ───────────► forge-pi-worker
  │ SQLite / 权限 / 账本       │ Pi SDK 会话、Skills、计划、子智能体
  │                          │ 每次运行的临时模型调用能力
  ◄──────────────────────────┘
  │ 平台模型网关 → 模型服务商
  │ 现有工具代理 → 沙箱编排服务 → 隔离的任务容器
  └ 审批、工具回执、产物提交及下载
```

三个入口已接入：

| 入口 | 默认引擎和行为 | 继续保留的 Forge 合约 |
| --- | --- | --- |
| `POST /api/threads/:id/messages` | Pi 原生会话及流式输出；受控聊天工具；按可用能力加载生态资源 | 消息、用户凭证、订阅用量、现有 SSE token/result 格式及工具记录 |
| `POST /api/agent-runs`，`execution_mode: "sandbox"` | Pi 驱动沙箱工具循环；原生会话检查点持久化；审批后恢复 | A/B/C 风险策略、工具幂等、审批归属、任务预算、产物哈希、账本、取消与重试 |
| `POST /api/agent-runs`，简化/default 模式 | 也默认使用 Pi；传入空工具列表，并关闭生态扩展与 MCP | 原有无工具 AgentProtocol 结果、用量、成本、哈希与证据合约 |

简化模式历史字段仍可能写作 `execution_mode: "legacy"`。这是原有执行模式名称，不能据此判断实际模型引擎；新建 Pi 任务会另外保存 `engine: "pi"`。

当前适配范围是上述三个智能体入口。仓库内其他单次模型生成路由仍可能保留原有调用方式，不能把此次接入描述为所有模型调用都已迁移。

## 2. 引擎选择、恢复与回退

`FORGE_AGENT_ENGINE` 仅接受 `pi` 或 `legacy`，不设置时默认 `pi`。无效值直接报错。

| 情况 | 行为 |
| --- | --- |
| 新聊天、新任务，环境未设置引擎 | 使用 Pi |
| 新聊天、新任务，显式 `FORGE_AGENT_ENGINE=legacy` | 使用原有实现 |
| 恢复已保存 `engine: "pi"` 的沙箱任务 | 继续 Pi，即使当前环境已改为 legacy |
| 恢复已保存 `engine: "legacy"` 或历史未标记引擎的沙箱任务 | 继续原有实现 |
| 重试创建新的任务尝试 | 按当前环境选择新引擎 |
| 默认 Pi 但 worker 未配置、未通过鉴权或不可达 | 新请求返回 HTTP 503，不自动切换旧循环 |

Pi 原生消息和计划存入 Forge 的 `sandbox_context`。审批暂停会保存原生工具调用标识；恢复时映射到已有 Forge 工具行，已经完成的工具调用不会再次执行。原生检查点是服务器恢复资料，不直接发送到浏览器。

本地回退新请求可执行：

```powershell
$env:FORGE_AGENT_ENGINE = 'legacy'
docker compose -f forge-pi.compose.yml up -d forge-platform
```

回退后仍应保留 worker，让已存在的 Pi 暂停任务能够按原引擎继续。不要把 Pi 的原生上下文改成 legacy 或删除任务记录来绕过恢复逻辑。重新启用 Pi 时把环境改为 `pi` 后重新创建平台服务即可。

## 3. 运行边界与凭证

- Pi worker 运行在独立 Node 24 容器内，使用非 root 用户、只读根文件系统和临时 `/tmp`；没有宿主目录或 Docker socket 挂载。
- 主聊天不提供宿主 shell、任意代码执行或宿主文件读写。公开 HTTP 工具只接受受限制的 GET/HEAD，阻止私网地址、认证头、请求体和重定向，并固定已校验的 DNS 地址。
- 沙箱文件、shell、浏览器、文档和产物操作继续经过 Forge 工具执行器及现有编排服务。只有沙箱编排服务持有 Docker socket。
- 用户的模型服务商 Key 留在 Forge 平台凭证系统中。worker 获得的是有期限、绑定本次运行与模型的网关地址和临时令牌。
- 模型网关、worker 及子会话执行共享调用次数、token 和取消约束；主聊天断开连接会向上传递取消。沙箱继续保留既有成本和工具预算。
- Pi 的计划完成状态属于智能体声明。外部动作是否发生、产物是否存在，以 Forge 工具回执、审批和产物记录为准。

### 模型服务商适配范围

平台网关目前适配 OpenAI、Anthropic、Google/Gemini、Groq、Mistral、OpenRouter、DeepSeek、xAI 和 Morph。网关显式传入真实服务商的协议兼容参数，因为 worker 看到的是 Forge 内部回调地址，无法依靠公网域名推断服务商差异。例如 Mistral 保留工具调用 ID，并在后续工具结果中提供其要求的名称字段。

当前每次 Pi 运行固定服务商与模型，恢复沙箱任务使用该任务保存的配置；不支持把同一份原生 `piMessages` 直接搬到另一个服务商继续执行。需要更换服务商时，应建立新的运行上下文，而不是直接修改已有原生会话的配置。

独立网关回归已使用真实 Pi SDK 验证 11 个协议场景，包括 Mistral 两轮工具往返。外部服务商请求在测试中被本地 fixture 截获；因此它验证了路由、请求字段、认证边界和响应解析，不代表真实 API Key、模型权限、实时模型供应、网络连通性或服务商在线可用性已实测。

## 4. 已接入的生态资源

依赖版本固定在 `forge-pi-worker/package.json` 和 lockfile：Pi coding-agent/TUI 为 `0.85.1`，社区 `pi-mcp-adapter` 为 `2.32.1`。直接依赖的 `pi-ai 0.84.1` 用于 MCP 适配器的 peer 兼容，SDK 自身依赖由 lockfile 固定；升级时需要一起验证，不能只改其中一个版本号。

### Skills 与提示模板

这四份 Skill 是 Forge 编写的流程指令，使用 Pi Agent Skills 格式。两个扩展使用 Pi 官方扩展 API 和官方示例模式，不能把它们称为复制来的社区插件。

| Skill | Pi 提示模板名 | 需要的现有工具 |
| --- | --- | --- |
| `forge-research` | `forge-research` | `sandbox_browser`、`sandbox_file`、`sandbox_artifact` |
| `forge-documents` | `forge-documents` | `sandbox_file`、`sandbox_document`、`sandbox_artifact` |
| `forge-planning` | `forge-plan` | 无额外工具 |
| `forge-code-diagnosis` | `forge-diagnose` | `sandbox_file`、`sandbox_shell`、`sandbox_artifact` |

资源清单位于 `forge-pi-worker/ecosystem.json`，提示模板由资源加载器生成。模板会通过 `forge_skill` 加载对应 Skill，并把任务参数传入。可用资源按本次会话实际工具过滤：主聊天通常只有规划 Skill；拥有完整沙箱工具的会话可以使用四份 Skill。简化 Agent Run 明确关闭这些资源。模板注册不等同于前端已增加可见的模板选择器。

`forge_plan` 支持最多 12 个步骤，同时最多一个 `in_progress`；标记 `completed` 时必须附带证据文字。worker 内的 `appendEntry` 本身不是持久化数据库，沙箱恢复依赖 Forge 保存的原生检查点和 `piPlan`。

### 真正的子智能体

父会话收到 `spawn_agent` 工具时，会创建另一个真实 Pi SDK 会话并返回它的实际结果。当前深度最多一层，每次根运行最多派生四个子会话；子会话不能再派生，继承共享预算和取消信号，只能使用父会话允许的受限读取工具。

该能力只在父会话确实暴露 `spawn_agent` 时存在。主聊天可使用；当前沙箱默认的五个工具列表不含 `spawn_agent`，简化 Agent Run 没有工具。不要把它理解成所有任务都会自动并行。

### 插件安装策略

默认不发现 `~/.pi`、项目目录、宿主全局 Skills 或用户自带扩展，不允许租户安装代码。新增插件需要由维护者固定版本、检查依赖及执行能力、加入 worker 构建并验证。当前没有自动插件安装市场，也没有把任意 Pi CLI 插件转换成多租户服务端插件的通用机制。

## 5. 本地启动：先沙箱，再 Pi

本文命令在仓库根目录执行，使用 Docker Desktop 的 Linux containers。当前镜像源已采用国内地址：Node 基础镜像使用 `docker.m.daocloud.io`，平台及既有沙箱的 Debian 软件源使用阿里云，npm 使用 `https://registry.npmmirror.com`。worker 不额外安装 apt 软件包。

### 必要配置

通过部署环境或独立配置文件提供下列变量。不要覆盖现有 `.env`，也不要把真实值写进本文或终端输出。

| 变量 | 要求 |
| --- | --- |
| `JWT_SECRET` | 平台 JWT 签名密钥 |
| `CREDENTIAL_ENCRYPTION_KEY` | 平台凭证加密密钥；复用数据库时必须与原值一致 |
| `ADMIN_PASSWORD` | 本地平台初始管理员密码 |
| `ADMIN_EMAIL` | 可选，默认 `admin@forge.local` |
| `FORGE_PI_WORKER_TOKEN` | 单独生成的至少 32 字符随机令牌；平台和 worker 必须一致 |
| `FORGE_SANDBOX_HMAC_SECRET` | 平台与沙箱编排服务必须使用同一个值 |
| `FRONTEND_URL` | 允许访问平台的前端地址；默认 `http://localhost:3001` |
| `FORGE_SANDBOX_EGRESS_ALLOWLIST` | 依据具体沙箱任务配置允许访问的外部目标 |

Compose 已设置 `FORGE_PI_WORKER_URL=http://forge-pi-worker:8791`、`FORGE_PI_PLATFORM_URL=http://forge-platform:3000`。自行拆分部署时，后者必须是 **worker 能访问的平台回调地址**；两个独立容器之间不能用 `127.0.0.1` 代替平台地址。

模型 Key 继续通过平台原有配置或用户凭证入口提供，不放进 worker 环境。

### 启动命令

```powershell
docker compose -f forge-sandbox.compose.yml --profile runtime-image build
docker compose -f forge-sandbox.compose.yml up -d forge-sandbox-egress forge-sandbox-orchestrator
docker compose -f forge-pi.compose.yml up -d --build
docker compose -f forge-pi.compose.yml ps
Invoke-RestMethod -Uri 'http://127.0.0.1:3300/health'
Invoke-RestMethod -Uri 'http://127.0.0.1:3300/ready'
```

先启动沙箱项目会创建 `forge-sandbox-control`，Pi Compose 将此网络声明为 external 并加入。仅启动 Pi Compose 而没有已有 control 网络会失败。只手动创建网络不能替代启动真实沙箱服务。

本地平台仅映射 `127.0.0.1:3300`，worker 不对宿主发布端口。本 Compose 不启动前端。单独启动既有前端时，需要将其 `NEXT_PUBLIC_API_BASE_URL` 指向 `http://localhost:3300/api`，并确保 `FRONTEND_URL` 与前端地址匹配。

健康检查通过后，还需用测试账号执行一条主聊天和一条沙箱任务，确认模型回调、审批、产物下载及用量记录。`/health` 或 `/ready` 成功本身不能证明这些业务路径通过。

### 数据库范围

`forge-pi.compose.yml` 使用独立的 `forge_pi_platform_data` 命名卷，数据库位置为 `/data/forge.db`。这是端口 3300 上的新本地环境，不会自动导入既有 Railway/生产数据库、用户、凭证或历史产物。

生产迁移前要另外制定并执行数据库备份与恢复、原有凭证加密密钥延续、数据卷接入、在途审批任务恢复、单实例 SQLite 写入及正式访问地址验收。当前本地通过结果不覆盖这些工作。

## 6. MCP：默认关闭，显式配置后接入只读能力

`pi-mcp-adapter 2.32.1` 已打包，但默认没有启用的服务器。启用需要同时满足以下条件：

1. worker 获得运维提供的服务器配置文件，并通过 `FORGE_PI_MCP_CONFIG` 指向该文件。
2. 平台配置当前用户、服务器和原始工具名称的精确只读允许名单。
3. worker 有实际可用、限制到已批准目标的网络出口。

当前 `forge-pi.compose.yml` **没有挂载 MCP 配置、没有设置 `FORGE_PI_MCP_CONFIG`，worker 也只连接 internal 的 `pi-private` 网络，不能访问互联网**。只设置平台允许名单不会让远程 MCP 工作。模型调用仍然能通过连接出网网络的平台网关转发，这与 worker 自己访问 MCP 服务器是两条路径。

### worker 配置格式

以下只是格式示例，`mcp.example.com` 和 `search_docs` 必须换成已验证的实际地址和工具名：

```json
{
  "mcpServers": {
    "docs": {
      "url": "https://mcp.example.com/mcp",
      "includeTools": ["search_docs"],
      "disabled": false,
      "requestTimeoutMs": 30000
    }
  }
}
```

配置由运维以只读文件挂载；可选覆盖文件会挂到容器内 `/run/forge/pi-mcp.json`，并设置 `FORGE_PI_MCP_CONFIG`。它不能由租户请求动态提交。最多 8 个服务器，每个服务器 1–32 个精确工具名，不允许通配符；仅接受 HTTPS streamable HTTP，关闭 stdio/command、OAuth 自动授权、宿主配置发现、sampling、elicitation、script mode、resources 和 direct tools。

如服务器要求认证，可以由运维提供 `headers` 字符串字段。此配置不展开 `${ENV_VAR}`，不应在示例、Git 或日志中放入真实认证值；MCP 认证也不应复用用户模型 Key。

### 平台授权格式

`FORGE_PI_MCP_READ_ONLY_TOOLS` 是 JSON 字符串，按真实 Forge 用户 ID 配置：

```json
{
  "REPLACE_WITH_ACTUAL_FORGE_USER_ID": {
    "docs": ["search_docs"]
  }
}
```

用户 ID、服务器名及工具原始名称必须与本次运行完全匹配。配置缺失、解析失败或包含通配符时拒绝调用。服务器配置和平台允许名单都需要允许该工具。

“只读”来自运维对服务与工具实际行为的审查，不能凭工具名字证明。当前 `allow_once` 是平台能力授权回调，不等于支持外部写操作的持久化用户审批界面。发邮件、提交表单、上传业务文件等外部写操作继续走已有 Forge 沙箱或 Drive 审批路径。MCP 记录以实际执行后的 `tool_end` 回执进入账本。

### 可选的受控出网覆盖文件

`forge-pi.mcp.compose.yml` 提供显式启用的 MCP 配置挂载及出口代理，复用既有沙箱代理实现。worker 仍只连接 internal 的 `pi-private`；新增的 `forge-pi-mcp-egress` 代理同时连接私有网络与出网网络，并执行目标限制。

准备运维管理的 MCP JSON 文件、真实 Forge 用户的工具允许名单，以及所需服务器的域名后，使用以下命令。路径、用户 ID、域名和工具名均为需要替换的示例：

```powershell
$env:FORGE_PI_MCP_CONFIG_FILE = 'D:/forge-config/pi-mcp.json'
$env:FORGE_PI_MCP_EGRESS_ALLOWLIST = 'mcp.example.com'
$env:FORGE_PI_MCP_READ_ONLY_TOOLS = '{"REPLACE_WITH_ACTUAL_FORGE_USER_ID":{"docs":["search_docs"]}}'
docker compose -f forge-pi.compose.yml -f forge-pi.mcp.compose.yml config --quiet
docker compose -f forge-pi.compose.yml -f forge-pi.mcp.compose.yml up -d --build
```

这里的网络允许名单按逗号分隔，复用代理的规则是允许指定主机名 **及其子域名**，并阻止私网目标和不支持的端口。它不是“只能访问一个精确域名”的规则；应使用最窄的服务主机名，避免填入宽泛的共享根域。用户、服务器和工具的允许名单仍是精确匹配，与网络允许名单是两层独立检查。

覆盖文件通过 `NODE_USE_ENV_PROXY=1`、`HTTP_PROXY` 与 `HTTPS_PROXY` 让 Node 使用该代理；`NO_PROXY` 为 `forge-platform,127.0.0.1,localhost`，保留模型回调直连。自行更改平台服务名或回调地址时，需要同步核对绕过规则，不能把私有平台回调送进公网代理。

已用构建镜像内的 Node 24.20.0 和隔离的本地代理 fixture 验证：HTTPS 请求确实到达代理，`NO_PROXY` 保留本地模型回调；默认和叠加 MCP 覆盖文件的 Compose 配置检查均通过。这项烟测没有连接真实外部 MCP。配置实际服务后，仍需验证 DNS、TLS、认证、禁止访问目标、跨用户拒绝和一次真实只读调用，再确认该服务接入可用。

## 7. 验证记录与复现

### 最终验证总表

以下结果来自 2026-09-06 的最终代码及最新平台/worker 镜像验证：

| 验证项 | 结果 | 范围 |
| --- | --- | --- |
| worker 单元与真实 SDK 回归 | 24/24 通过 | SDK 会话及 worker 相关行为 |
| Forge + Pi 集成回归 | 7/7 业务子测试通过；TAP 8/8；约 14.54 秒 | 真实 Forge API、SQLite、Pi SDK、网关；本地模型与 broker mock |
| 独立服务商网关回归 | 11/11 通过 | 多服务商协议及认证边界，包含 Mistral 两轮工具往返；无真实公网服务商调用 |
| 前端流式事件回归 | 8/8 通过 | 现有 ForgeApp 中 Pi 流式事件的处理 |
| Next 正常生产构建 | 成功，静态页面生成 21/21 | 保留项目原有跳过 TypeScript/lint 的构建配置，不能据此声称类型检查或 lint 通过 |
| 既有 sandbox-contract 回归 | 6/6 通过 | 状态、工具参数、路径及审批风险合约 |
| 既有 recovery + Drive 回归 | 合计 2/2 通过 | 历史恢复与 Drive 证据边界的既有回归 |
| 默认/可选 MCP Compose 配置 | 两种配置均通过 | 配置解析；不等于运行所有外部服务 |
| MCP 代理烟测 | 通过 | Node 24.20.0 本地代理 fixture 和 NO_PROXY 回调；无真实外部 MCP 调用 |

### 已通过的集成回归

`forge-platform/scripts/pi-integration-regression.cjs` 使用真实 Pi SDK worker、真实 Forge API、模型网关和 SQLite；模型服务商及沙箱 broker 使用本地确定性 mock。broker 会核对 HMAC，实际维护测试文件字节，并校验产物哈希与下载结果。

2026-09-06 最后一次集成回归：**7 个业务子测试全部通过**，Node TAP 包含父测试后统计 `tests 8 / pass 8 / fail 0`，无跳过，退出码 0，耗时约 14.54 秒。

| 场景 | 已验证结果 |
| --- | --- |
| 默认 Pi 但 worker 缺失 | HTTP 503，模型调用次数为零 |
| 主聊天 | Pi 原生流式 token；模型提出的宿主 shell 调用被拒绝，真实拒绝结果回到模型 |
| 简化 Agent Run | 默认使用 Pi、工具列表为空，成本、token、哈希及原有证据合约持久化 |
| 沙箱审批恢复 | 原生暂停持久化；批准后同一工具只执行一次；重复批准不重复执行；原生 toolResult 保存；产物下载字节和哈希一致 |
| 用户隔离与拒绝 | 其他用户审批和下载返回 404；拒绝后 Pi 恢复，浏览器动作未执行 |
| 取消 | 待审批取消、模型流期间取消及真实聊天连接断开均停止上游连接；断开后不继续备用模型或追加最终回复 |
| 预算与计费 | 工具预算阻止第二次副作用；成功调用的 usage_logs 合计与订阅 tokens_used 一致 |

这些结果证明适配链路及业务边界在本地测试下成立，不构成真实服务商性能、外部浏览器操作、MCP 联网、生产恢复或生产部署验收。

### worker 单元与 SDK 回归

在 Node 24 环境的 `forge-pi-worker` 目录执行：

```powershell
npm ci --ignore-scripts --registry=https://registry.npmmirror.com
npm test
```

2026-09-06 worker 回归已实际通过 **24/24**。该数量取自测试运行结果，不是按文件中的 `test(` 文本计数。

### 集成回归命令

以下命令对应已验证的专用测试容器布局，不是默认 Compose 的服务名称。前提是已用当前源代码构建 `forge-platform:pi-local` 和 `forge-pi-worker:local`，创建专用 internal 测试网络，在该网络启动 `forge-pi-worker-test` 与 `forge-pi-platform-test`，并把 `forge-platform/scripts` 只读挂载到平台测试容器的 `/regression`。平台镜像内已编译的应用和依赖位于 `/app`。测试容器需要允许其 `/tmp` 创建临时数据库。

worker 启动时和运行下列命令时必须使用同一个专用测试令牌。示例值是公开的本地回归占位值，不可用于正式服务：

```powershell
$env:FORGE_PI_WORKER_TOKEN = 'forge-pi-local-regression-capability-20260906'
docker exec -e FORGE_PLATFORM_ROOT=/app -e NODE_PATH=/app/node_modules -e FORGE_PI_WORKER_URL=http://forge-pi-worker-test:8791 -e FORGE_PI_WORKER_TOKEN -e FORGE_PI_PLATFORM_TEST_HOST=forge-pi-platform-test forge-pi-platform-test node --test /regression/pi-integration-regression.cjs
```

脚本自行启动临时 Forge 后端、模型 mock 和 broker mock，并给 worker 设置能反向访问该临时后端的容器主机名。不要把平台回调地址改成 worker 的 localhost，也不要将测试模型 URL 配置到正式运行环境。只读容器不能通过 `docker cp` 热替换代码；代码变化后应重建镜像并重建对应测试容器再运行。

### 独立网关、前端及既有回归命令

独立服务商测试自行启动本地网关和真实 SDK worker，不依赖上述两个测试容器。先按前文安装 `forge-pi-worker` 的依赖，再在仓库根目录使用 Node 24 执行：

```powershell
node --test forge-platform/scripts/pi-provider-gateway-regression.cjs
```

前端依赖已安装时，在 `forge-web-studio` 目录执行：

```powershell
node --test scripts/pi-streaming-regression.cjs
npm run build
```

平台依赖已安装时，在 `forge-platform` 目录执行以下既有回归；第一条同时编译后续恢复测试所需的应用：

```powershell
npm run test:sandbox-contract
npm run test:sandbox-recovery
npm run test:google-drive
```

这些回归使用测试夹具与临时状态，不能替代生产数据库恢复演练、真实 Drive 账号写回或线上浏览器验收。

## 8. 源文件导航

| 文件 | 责任 |
| --- | --- |
| `forge-platform/src/pi-runtime.ts` | worker 协议、鉴权、模型网关、每次运行预算及 MCP 用户授权 |
| `forge-platform/src/index.ts` | 三个入口接入、工具执行、审批恢复、持久化、用量和 SSE |
| `forge-pi-worker/src/server.mjs` | 独立 worker HTTP 服务、启动配置及并发限制 |
| `forge-pi-worker/src/runtime.mjs` | 真实 Pi SDK 会话、检查点、取消、压缩与子智能体 |
| `forge-pi-worker/ecosystem.mjs` | Skill/提示模板加载、计划扩展与受限 MCP 适配 |
| `forge-pi-worker/ecosystem.json` | 固定生态资源及来源清单 |
| `forge-pi-worker/skills/` | 四份 Forge Skill |
| `forge-pi.compose.yml` | 独立本地平台、Pi worker 和网络/数据卷 |
| `forge-pi.mcp.compose.yml` | 可选 MCP 只读配置挂载与受控出口代理 |
| `forge-sandbox.compose.yml` | 既有沙箱执行与出口服务 |
| `forge-platform/scripts/pi-integration-regression.cjs` | 真实 SDK + Forge 的集成回归 |
| `forge-platform/scripts/pi-provider-gateway-regression.cjs` | 多服务商网关与实际 SDK 的本地协议回归 |
| `forge-web-studio/scripts/pi-streaming-regression.cjs` | 前端 Pi 流式事件处理回归 |

Pi 官方项目：<https://github.com/earendil-works/pi>。社区 MCP 适配器：<https://github.com/nicobailon/pi-mcp-adapter>。升级依赖前应重新核对对应版本接口、许可证及本手册中的限制，并重跑相关回归。
