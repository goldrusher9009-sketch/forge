/**
 * Forge Phone Agent — Core agent loop
 *
 * Architecture:
 *  1. User gives a goal
 *  2. App captures screenshot of current screen
 *  3. Screenshot + goal + history → POST /api/phone-agent/action
 *  4. AI returns next action (tap, type, swipe, back, etc.)
 *  5. App executes action via Accessibility Service (Android) or XCTest (iOS)
 *  6. Repeat until action === 'done' or user stops
 *
 * On Android, step 5 requires an AccessibilityService to actually control other apps.
 * This class handles steps 1-4 and delegates step 5 to platform bridges.
 */

import { FORGE_API, AgentStep, PhoneAction } from './config';

export class ForgeAgentLoop {
  private sessionId: number | null = null;
  private goal: string = '';
  private token: string = '';
  private steps: AgentStep[] = [];
  private running = false;
  private onStep?: (step: AgentStep) => void;
  private onDone?: (summary: string, steps: AgentStep[]) => void;
  private onError?: (msg: string) => void;
  private captureScreenshot?: () => Promise<string | null>;
  private executeAction?: (action: PhoneAction) => Promise<boolean>;

  constructor(opts: {
    token: string;
    captureScreenshot: () => Promise<string | null>;
    executeAction: (action: PhoneAction) => Promise<boolean>;
    onStep?: (step: AgentStep) => void;
    onDone?: (summary: string, steps: AgentStep[]) => void;
    onError?: (msg: string) => void;
  }) {
    this.token = opts.token;
    this.captureScreenshot = opts.captureScreenshot;
    this.executeAction = opts.executeAction;
    this.onStep = opts.onStep;
    this.onDone = opts.onDone;
    this.onError = opts.onError;
  }

  async start(goal: string, maxSteps = 20): Promise<void> {
    if (this.running) return;
    this.goal = goal;
    this.steps = [];
    this.running = true;

    try {
      // Create session
      const sessResp = await fetch(`${FORGE_API}/api/phone-agent/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ goal })
      });
      const sess = await sessResp.json();
      this.sessionId = sess.session_id;

      for (let i = 0; i < maxSteps && this.running; i++) {
        // Capture screen
        const screenshot = this.captureScreenshot ? await this.captureScreenshot() : null;

        // Ask AI for next action
        const actionResp = await fetch(`${FORGE_API}/api/phone-agent/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
          body: JSON.stringify({
            goal: this.goal,
            screenshot_base64: screenshot,
            action_history: this.steps.map(s => ({ action: s.action, args: s.args, result: 'executed' })),
            session_id: this.sessionId,
            screen_context: `Step ${i + 1} of ${maxSteps}`
          })
        });

        if (!actionResp.ok) {
          const err = await actionResp.json();
          this.onError?.(err.error || 'Agent API error');
          break;
        }

        const result = await actionResp.json();
        const step: AgentStep = {
          action: result.action,
          args: result.args || {},
          reasoning: result.reasoning || '',
          confidence: result.confidence || 0.5,
          progress: result.progress || '',
          screenshot: screenshot || undefined,
          timestamp: Date.now()
        };

        this.steps.push(step);
        this.onStep?.(step);

        // Done?
        if (result.action === 'done') {
          this.onDone?.(result.args?.summary || result.progress || 'Task complete', this.steps);
          break;
        }

        // Execute the action on device
        if (this.executeAction) {
          await this.executeAction(result as PhoneAction);
        }

        // Brief pause between steps
        await new Promise(r => setTimeout(r, result.action === 'wait' ? (result.args?.ms || 2000) : 800));
      }
    } catch (e: any) {
      this.onError?.(e.message);
    }

    this.running = false;
  }

  stop(): void {
    this.running = false;
  }

  getSteps(): AgentStep[] {
    return this.steps;
  }

  isRunning(): boolean {
    return this.running;
  }
}
