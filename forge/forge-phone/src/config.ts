// Forge Phone Agent — Config
export const FORGE_API = 'https://forge-production-2692.up.railway.app';
export const FORGE_WEB = 'https://forge-sand-two.vercel.app';

// Action types the AI can return
export type PhoneAction =
  | { action: 'tap'; args: { x: number; y: number; element: string } }
  | { action: 'long_press'; args: { x: number; y: number; element: string } }
  | { action: 'swipe'; args: { direction: 'up' | 'down' | 'left' | 'right'; element?: string } }
  | { action: 'scroll'; args: { direction: 'up' | 'down' } }
  | { action: 'type'; args: { text: string; element?: string } }
  | { action: 'back'; args: {} }
  | { action: 'home'; args: {} }
  | { action: 'wait'; args: { ms?: number } }
  | { action: 'done'; args: { summary?: string } };

export interface AgentStep {
  action: string;
  args: Record<string, any>;
  reasoning: string;
  confidence: number;
  progress: string;
  screenshot?: string;
  timestamp: number;
}

export interface PhoneSession {
  session_id: number;
  goal: string;
  steps: AgentStep[];
  status: 'active' | 'done' | 'stopped';
  token: string;
}
