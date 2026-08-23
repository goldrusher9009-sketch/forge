/**
 * Forge Phone Agent — permissioned client loop.
 *
 * The backend plans and persists one action. The Owner then approves that
 * exact action, the backend issues a one-time execution token, Android
 * executes the authorized payload, and the client reports native evidence.
 */

import {
  AgentStep,
  FORGE_API,
  NativeExecutionResult,
  PHONE_ACTION_NAMES,
  PhoneAction,
  PhoneSessionOptions,
} from './config';

type PlannedActionResponse = {
  action_id: string;
  session_id: number;
  action: PhoneAction['action'];
  args: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
  progress?: string;
  risk_level: 'low' | 'medium' | 'high';
  approval_required: boolean;
  approval_id?: string | null;
  execution_status: string;
};

type AuthorizedActionResponse = {
  action_id: string;
  session_id: number;
  action: PhoneAction['action'];
  args: Record<string, unknown>;
  execution_token: string;
  expected_package: string;
};

function asErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  return typeof value === 'string' ? value : 'Unknown Phone Agent error';
}

export class ForgeAgentLoop {
  private sessionId: number | null = null;
  private token: string;
  private steps: AgentStep[] = [];
  private running = false;
  private sessionTerminal = false;
  private onStep?: (step: AgentStep) => void;
  private onDone?: (summary: string, steps: AgentStep[]) => void;
  private onError?: (message: string) => void;
  private captureScreenshot: () => Promise<string | null>;
  private getCurrentPackage: () => Promise<string>;
  private executeAction: (action: PhoneAction, expectedPackage: string) => Promise<NativeExecutionResult>;
  private requestApproval: (step: AgentStep) => Promise<boolean>;

  constructor(opts: {
    token: string;
    captureScreenshot: () => Promise<string | null>;
    getCurrentPackage: () => Promise<string>;
    executeAction: (action: PhoneAction, expectedPackage: string) => Promise<NativeExecutionResult>;
    requestApproval: (step: AgentStep) => Promise<boolean>;
    onStep?: (step: AgentStep) => void;
    onDone?: (summary: string, steps: AgentStep[]) => void;
    onError?: (message: string) => void;
  }) {
    this.token = opts.token;
    this.captureScreenshot = opts.captureScreenshot;
    this.getCurrentPackage = opts.getCurrentPackage;
    this.executeAction = opts.executeAction;
    this.requestApproval = opts.requestApproval;
    this.onStep = opts.onStep;
    this.onDone = opts.onDone;
    this.onError = opts.onError;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${FORGE_API}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...(init.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = typeof payload?.error === 'string' ? payload.error : `HTTP_${response.status}`;
      const message = typeof payload?.message === 'string' ? `${code}: ${payload.message}` : code;
      throw new Error(message);
    }
    return payload as T;
  }

  private publishStep(step: AgentStep, changes: Partial<AgentStep> = {}): AgentStep {
    Object.assign(step, changes);
    this.onStep?.({ ...step, args: { ...step.args } });
    return step;
  }

  private async cancelSession(): Promise<void> {
    if (!this.sessionId || this.sessionTerminal) return;
    try {
      await this.request(`/api/phone-agent/sessions/${this.sessionId}/cancel`, {
        method: 'POST',
        body: '{}',
      });
    } catch {
      // The backend may already have made the session terminal (for example,
      // after Owner rejection). Never hide the original execution error.
    }
    this.sessionTerminal = true;
  }

  async start(goal: string, options: PhoneSessionOptions): Promise<void> {
    if (this.running) throw new Error('PHONE_SESSION_ACTIVE');
    this.steps = [];
    this.sessionId = null;
    this.sessionTerminal = false;
    this.running = true;

    try {
      const session = await this.request<{ session_id: number }>('/api/phone-agent/session', {
        method: 'POST',
        body: JSON.stringify({
          goal,
          max_steps: options.maxSteps,
          planning_only: options.planningOnly,
          allowed_actions: [...PHONE_ACTION_NAMES],
          allowed_packages: options.allowedPackages,
          confirmation_mode: options.confirmationMode,
          token_budget: options.tokenBudget,
          cost_budget_usd: options.costBudgetUsd,
        }),
      });
      this.sessionId = session.session_id;

      for (let index = 0; index < options.maxSteps && this.running; index += 1) {
        const screenshot = options.planningOnly ? null : await this.captureScreenshot();
        if (!options.planningOnly && !screenshot) throw new Error('PHONE_SCREENSHOT_REQUIRED');

        const currentPackage = options.planningOnly ? '' : (await this.getCurrentPackage()).trim();
        if (!options.planningOnly && !currentPackage) throw new Error('PHONE_CURRENT_PACKAGE_REQUIRED');

        const planned = await this.request<PlannedActionResponse>('/api/phone-agent/action', {
          method: 'POST',
          body: JSON.stringify({
            session_id: this.sessionId,
            screenshot_base64: screenshot,
            current_package: currentPackage,
            screen_context: `Step ${index + 1} of ${options.maxSteps}`,
          }),
        });

        const step: AgentStep = {
          id: planned.action_id,
          sessionId: planned.session_id,
          stepIndex: index + 1,
          action: planned.action,
          args: planned.args || {},
          reasoning: planned.reasoning || '',
          confidence: typeof planned.confidence === 'number' ? planned.confidence : 0,
          progress: planned.progress || '',
          riskLevel: planned.risk_level,
          approvalId: planned.approval_id || undefined,
          approvalRequired: planned.approval_required,
          status: options.planningOnly ? 'simulated' : planned.execution_status as AgentStep['status'],
          currentPackage: currentPackage || undefined,
          timestamp: Date.now(),
        };
        this.steps.push(step);
        this.publishStep(step);

        if (planned.action === 'done') {
          this.sessionTerminal = true;
          this.publishStep(step, { status: 'completed', executed: false, success: true });
          this.onDone?.(String(planned.args?.summary || planned.progress || 'Task complete'), [...this.steps]);
          break;
        }

        if (options.planningOnly) continue;

        if (planned.approval_required) {
          if (!planned.approval_id) throw new Error('PHONE_ACTION_APPROVAL_ORPHANED');
          const approved = await this.requestApproval({ ...step, args: { ...step.args } });
          if (!approved) {
            await this.request(`/api/approvals/${planned.approval_id}/reject`, { method: 'POST', body: '{}' });
            this.sessionTerminal = true;
            this.publishStep(step, { status: 'rejected', executed: false, success: false, error: 'Rejected by Owner' });
            throw new Error('PHONE_ACTION_REJECTED');
          }
          await this.request(`/api/approvals/${planned.approval_id}/approve`, { method: 'POST', body: '{}' });
          this.publishStep(step, { status: 'approved' });
        }

        if (!this.running) break;
        const packageBeforeExecution = (await this.getCurrentPackage()).trim();
        if (!packageBeforeExecution || packageBeforeExecution !== currentPackage) {
          throw new Error(`PHONE_PACKAGE_CHANGED: expected ${currentPackage || 'unknown'}`);
        }

        const authorized = await this.request<AuthorizedActionResponse>(`/api/phone-agent/actions/${planned.action_id}/authorize`, {
          method: 'POST',
          body: JSON.stringify({ current_package: packageBeforeExecution }),
        });
        if (authorized.action_id !== planned.action_id || authorized.action !== planned.action) {
          throw new Error('PHONE_ACTION_AUTHORIZATION_MISMATCH');
        }
        this.publishStep(step, { status: 'executing' });

        let nativeResult: NativeExecutionResult;
        try {
          nativeResult = await this.executeAction(
            { action: authorized.action, args: authorized.args } as PhoneAction,
            authorized.expected_package,
          );
        } catch (error) {
          nativeResult = {
            executed: false,
            success: false,
            currentPackage: authorized.expected_package,
            error: asErrorMessage(error).slice(0, 1000),
          };
        }

        const receipt = await this.request<{ status: AgentStep['status']; executed: boolean; success: boolean }>(
          `/api/phone-agent/actions/${planned.action_id}/result`,
          {
            method: 'POST',
            body: JSON.stringify({
              execution_token: authorized.execution_token,
              executed: nativeResult.executed,
              success: nativeResult.success,
              error: nativeResult.error || null,
              current_package: authorized.expected_package,
            }),
          },
        );
        this.publishStep(step, {
          status: receipt.status,
          executed: receipt.executed,
          success: receipt.success,
          error: nativeResult.error,
        });
        if (!receipt.executed || !receipt.success) {
          throw new Error(nativeResult.error || 'PHONE_NATIVE_ACTION_FAILED');
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (this.running && !this.sessionTerminal && this.steps.length >= options.maxSteps) {
        throw new Error('PHONE_MAX_STEPS_REACHED');
      }
    } catch (error) {
      await this.cancelSession();
      this.onError?.(asErrorMessage(error));
    } finally {
      this.running = false;
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.cancelSession();
  }

  getSteps(): AgentStep[] {
    return this.steps.map(step => ({ ...step, args: { ...step.args } }));
  }

  isRunning(): boolean {
    return this.running;
  }
}
