// Forge Phone Agent — controlled runtime configuration and shared contracts.
declare const process: { env: { EXPO_PUBLIC_FORGE_API_URL?: string } };

const configuredApi = process.env.EXPO_PUBLIC_FORGE_API_URL;
if (typeof configuredApi !== 'string' || !configuredApi.trim()) {
  throw new Error('EXPO_PUBLIC_FORGE_API_URL is required');
}
export const FORGE_API = configuredApi.trim().replace(/\/$/, '');

export const PHONE_ACTION_NAMES = [
  'tap', 'long_press', 'swipe', 'scroll', 'type', 'back', 'home', 'wait', 'done',
] as const;

export type PhoneActionName = typeof PHONE_ACTION_NAMES[number];

export type PhoneAction =
  | { action: 'tap'; args: { x: number; y: number; element: string } }
  | { action: 'long_press'; args: { x: number; y: number; element: string } }
  | { action: 'swipe'; args: { direction: 'up' | 'down' | 'left' | 'right'; element?: string } }
  | { action: 'scroll'; args: { direction: 'up' | 'down' | 'left' | 'right'; element?: string } }
  | { action: 'type'; args: { text: string; element?: string } }
  | { action: 'back'; args: Record<string, never> }
  | { action: 'home'; args: Record<string, never> }
  | { action: 'wait'; args: { ms: number } }
  | { action: 'done'; args: { summary?: string } };

export type AgentStepStatus =
  | 'simulated'
  | 'pending_approval'
  | 'approved'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'not_executed'
  | 'rejected'
  | 'completed';

export interface AgentStep {
  id: string;
  sessionId: number;
  stepIndex: number;
  action: PhoneActionName;
  args: Record<string, unknown>;
  reasoning: string;
  confidence: number;
  progress: string;
  riskLevel: 'low' | 'medium' | 'high';
  approvalId?: string;
  approvalRequired: boolean;
  status: AgentStepStatus;
  currentPackage?: string;
  executed?: boolean;
  success?: boolean;
  error?: string;
  timestamp: number;
}

export interface NativeExecutionResult {
  executed: boolean;
  success: boolean;
  currentPackage: string;
  observedPackageAfter?: string;
  error?: string;
}

export interface PhoneSessionOptions {
  maxSteps: number;
  planningOnly: boolean;
  allowedPackages: string[];
  confirmationMode: 'every_action' | 'sensitive';
  tokenBudget: number;
  costBudgetUsd: number;
}
