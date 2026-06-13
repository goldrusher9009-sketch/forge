/**
 * Fable 5 twin intelligence service
 * Model: claude-fable-5 (1M context, 128k output)
 * Falls back gracefully if ANTHROPIC_API_KEY not set
 */

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TwinContext {
  vScore: number
  tier: string
  rings: {
    sleep: number
    nutrition: number
    activity: number
    social: number
    wealth: number
  }
  handle: string
  displayName: string
}

interface Fable5Response {
  response: string
  agentType: string
  usedAI: boolean
}

export interface VisionScanResult {
  rings: Partial<Record<'sleep' | 'nutrition' | 'activity' | 'social' | 'wealth', number>>
  rawText: string
  confidence: 'high' | 'medium' | 'low'
  notes: string
  usedAI: boolean
}

export interface AgentRunResult {
  success: boolean
  result: string
  actions: string[]
  usedAI: boolean
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

function buildSystemPrompt(ctx: TwinContext): string {
  const { rings } = ctx
  const entries = Object.entries(rings) as [string, number][]
  const weakest = entries.sort((a, b) => a[1] - b[1])[0]
  const strongest = entries.sort((a, b) => b[1] - a[1])[0]

  return `You are the AI Twin for ${ctx.displayName} (@${ctx.handle}) on VIVA — a sovereign intelligence platform.

CURRENT USER STATE:
- V-Score: ${ctx.vScore} | Tier: ${ctx.tier}
- Sleep Ring: ${rings.sleep}%
- Nutrition Ring: ${rings.nutrition}%
- Activity Ring: ${rings.activity}%
- Social Ring: ${rings.social}%
- Wealth Ring: ${rings.wealth}%
- Strongest ring: ${strongest[0]} (${strongest[1]}%)
- Weakest ring: ${weakest[0]} (${weakest[1]}%) — highest-leverage focus

YOUR ROLE:
You are a high-signal, low-fluff AI twin. You know this user's biometrics, finances, social standing, and goals.
You speak like a brilliant chief of staff — direct, data-driven, action-oriented. No filler. No therapy-speak.
You surface the most leverage action given the user's current ring data.

PLATFORM CONTEXT:
- VIVA is a sovereignty platform: health rings, prediction markets, YouTokens, audio rooms, dating by V-Score
- Autonomy levels: L1 (read-only), L2 (recommend), L3 (execute, unlocked at V-Score 800+)
- Users with V-Score ${ctx.vScore >= 800 ? `${ctx.vScore} (L3 eligible)` : `${ctx.vScore} (${800 - ctx.vScore} pts from L3)`}
- Active markets: Longevity escape velocity (22% YES), BTC $100K, ETH flip, AI GDP

RESPONSE RULES:
- 2-4 sentences max unless asked for detail
- Always tie advice to specific ring numbers
- Suggest one concrete next action
- Never say "I'm just an AI" or similar hedges
- Classify your response as one of: health | market | finance | social | twin | default`
}

function classifyAgentType(content: string): string {
  const lower = content.toLowerCase()
  if (lower.includes('sleep') || lower.includes('nutrition') || lower.includes('activity') || lower.includes('ring')) return 'health'
  if (lower.includes('market') || lower.includes('stake') || lower.includes('predict')) return 'market'
  if (lower.includes('token') || lower.includes('wealth') || lower.includes('finance')) return 'finance'
  if (lower.includes('social') || lower.includes('match') || lower.includes('connect')) return 'social'
  if (lower.includes('twin') || lower.includes('autonomy') || lower.includes('task')) return 'twin'
  return 'default'
}

const VISION_SYSTEM = `You are a health data extraction AI for the VIVA platform.

Your job: parse a health tracker screenshot, sleep app export, wearable report, or lab result image and extract ring-relevant values.

VIVA has 5 rings, each scored 0-100:
- sleep: based on hours slept (7-9h = ~80-95, 6-7h = ~60-75, <6h = ~30-55)
- nutrition: based on diet quality, macro tracking, meal score (excellent=85+, good=65-84, fair=40-64)
- activity: based on steps, workouts, active calories (10k+ steps = 85+, 7-10k = 65-84, <5k = 40-60)
- social: cannot be extracted from health images — omit
- wealth: cannot be extracted from health images — omit

OUTPUT FORMAT (valid JSON only, no markdown, no explanation outside the JSON):
{
  "rings": {
    "sleep": <number 0-100 or null if not found>,
    "nutrition": <number 0-100 or null if not found>,
    "activity": <number 0-100 or null if not found>
  },
  "confidence": "high" | "medium" | "low",
  "notes": "<one sentence describing what was found in the image>"
}

Rules:
- Only include rings you can actually derive from the image data
- If a ring can't be extracted, omit it from the rings object
- confidence: "high" if exact numbers found, "medium" if estimated from partial data, "low" if guessing
- Never fabricate values — if image is unclear, return confidence "low" with empty rings`

export async function scanHealthImage(
  base64Image: string,
  mimeType: string = 'image/jpeg',
): Promise<VisionScanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { rings: {}, rawText: '', confidence: 'low', notes: 'AI vision not configured', usedAI: false }
  }

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-fable-5',
        max_tokens: 512,
        system: VISION_SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64Image },
              },
              {
                type: 'text',
                text: 'Extract health ring values from this image. Return only the JSON object.',
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      console.error('[fable5 vision] API error:', res.status)
      return { rings: {}, rawText: '', confidence: 'low', notes: 'Vision API error', usedAI: false }
    }

    const data = await res.json() as any

    if (data.stop_reason === 'refusal') {
      return { rings: {}, rawText: '', confidence: 'low', notes: 'Image could not be processed', usedAI: false }
    }

    const rawText = data.content?.[0]?.text ?? ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { rings: {}, rawText, confidence: 'low', notes: 'Could not parse vision response', usedAI: true }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const rings: VisionScanResult['rings'] = {}
    for (const [k, v] of Object.entries(parsed.rings ?? {})) {
      if (v !== null && typeof v === 'number' && ['sleep', 'nutrition', 'activity', 'social', 'wealth'].includes(k)) {
        rings[k as keyof typeof rings] = Math.min(100, Math.max(0, Math.round(v as number)))
      }
    }

    return {
      rings,
      rawText,
      confidence: parsed.confidence ?? 'medium',
      notes: parsed.notes ?? '',
      usedAI: true,
    }
  } catch (e) {
    console.error('[fable5 vision] error:', e)
    return { rings: {}, rawText: '', confidence: 'low', notes: 'Vision processing failed', usedAI: false }
  }
}

export async function twinChat(
  message: string,
  ctx: TwinContext,
  history: Message[] = [],
): Promise<Fable5Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { response: '', agentType: 'default', usedAI: false }
  }

  const messages: Message[] = [
    ...history.slice(-10),
    { role: 'user', content: message },
  ]

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-fable-5',
        max_tokens: 512,
        system: buildSystemPrompt(ctx),
        messages,
      }),
    })

    if (res.status === 200) {
      const data = await res.json() as any
      if (data.stop_reason === 'refusal') {
        return { response: '', agentType: 'default', usedAI: false }
      }
      const text = data.content?.[0]?.text ?? ''
      return {
        response: text,
        agentType: classifyAgentType(text),
        usedAI: true,
      }
    }

    console.error('[fable5] API error:', res.status, await res.text())
    return { response: '', agentType: 'default', usedAI: false }
  } catch (e) {
    console.error('[fable5] fetch error:', e)
    return { response: '', agentType: 'default', usedAI: false }
  }
}

// ── Agentic task execution ────────────────────────────────────────────────────

const AGENT_SYSTEM = `You are an AI agent executing a delegated task on VIVA.
You have been given a task to execute. Reason through what actions to take, then output a JSON execution plan.

OUTPUT FORMAT (valid JSON only):
{
  "actions": ["action1", "action2"],
  "result": "one sentence summary of what was accomplished or decided",
  "success": true
}

Rules:
- Be specific about what you would do (e.g. "Log sleep ring at 82%" not "improve health")
- If the task is ambiguous or impossible, set success: false and explain in result
- Max 3 actions`

export async function runAgentTask(
  task: { title: string; description?: string | null; agentType: string; autonomy: number },
  ctx: TwinContext,
): Promise<AgentRunResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      success: false,
      result: 'Fable 5 not configured — add ANTHROPIC_API_KEY to activate agentic tasks',
      actions: [],
      usedAI: false,
    }
  }

  const prompt = `Task: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Agent type: ${task.agentType}
Autonomy level: L${task.autonomy}

User context:
- V-Score: ${ctx.vScore} | Tier: ${ctx.tier}
- Rings: sleep ${ctx.rings.sleep}%, nutrition ${ctx.rings.nutrition}%, activity ${ctx.rings.activity}%, social ${ctx.rings.social}%, wealth ${ctx.rings.wealth}%

Execute this task. At L${task.autonomy} autonomy, you ${task.autonomy >= 3 ? 'can execute directly' : task.autonomy === 2 ? 'should recommend and stage actions for user approval' : 'should analyze and report only'}.`

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-fable-5',
        max_tokens: 512,
        system: AGENT_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      return { success: false, result: `Agent API error: ${res.status}`, actions: [], usedAI: false }
    }

    const data = await res.json() as any
    if (data.stop_reason === 'refusal') {
      return { success: false, result: 'Task refused by safety classifier', actions: [], usedAI: false }
    }

    const rawText = data.content?.[0]?.text ?? ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: true, result: rawText.slice(0, 200), actions: [], usedAI: true }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      success: parsed.success ?? true,
      result: parsed.result ?? '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      usedAI: true,
    }
  } catch (e) {
    console.error('[fable5 agent] error:', e)
    return { success: false, result: 'Agent execution failed', actions: [], usedAI: false }
  }
}
