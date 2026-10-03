// Forge Phone Agent — controlled runtime configuration and shared contracts.
declare const process: { env: {
  EXPO_PUBLIC_FORGE_API_URL?: string;
  EXPO_PUBLIC_FORGE_WEB_ORIGIN?: string;
  EXPO_PUBLIC_APPTOPIA_ORIGIN?: string;
} };
declare const __DEV__: boolean;
// React Native 0.74's global URL does not implement origin or hostname.
export const ForgeURL = require('whatwg-url-without-unicode').URL as typeof URL;

const configuredApi = process.env.EXPO_PUBLIC_FORGE_API_URL;
export const FORGE_API = (() => {
  try { return normalizeForgeApiUrl(configuredApi || ''); }
  catch { return ''; }
})();

export function normalizeForgeApiUrl(value: string, allowLocalHttp = typeof __DEV__ !== 'undefined' && __DEV__): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('SERVICE_URL_REQUIRED');
  if (trimmed.length > 2048 || /[\\\s\u0000-\u001f\u007f]/.test(trimmed)) throw new Error('SERVICE_URL_INVALID');
  let url: URL;
  try { url = new ForgeURL(trimmed); } catch { throw new Error('SERVICE_URL_INVALID'); }
  if (url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) {
    throw new Error('SERVICE_URL_INVALID');
  }
  const host = url.hostname.toLowerCase();
  url.hostname = host;
  const octets = host.split('.').map(Number);
  const ipv4 = /^\d+\.\d+\.\d+\.\d+$/.test(host) && octets.every(octet => octet >= 0 && octet <= 255);
  const local = host === 'localhost' || host === '[::1]' || (ipv4 && (octets[0] === 127 || octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)));
  if (url.protocol !== 'https:' && !(allowLocalHttp && url.protocol === 'http:' && local)) {
    throw new Error('SERVICE_HTTPS_REQUIRED');
  }
  return url.origin;
}

function httpsOrigin(value: string): string {
  try { return normalizeForgeApiUrl(value, false); }
  catch { return ''; }
}

const OFFICIAL_FORGE_ORIGIN = 'https://forge-sand-two.vercel.app';
// A custom API has a web counterpart only when both origins are explicitly configured.
const pairedApiOrigin = httpsOrigin(configuredApi || '');
const pairedWebOrigin = httpsOrigin(process.env.EXPO_PUBLIC_FORGE_WEB_ORIGIN || '');
const configuredMarketplace = process.env.EXPO_PUBLIC_APPTOPIA_ORIGIN;
const marketplaceOrigin = httpsOrigin(configuredMarketplace === undefined ? 'https://apptopia.ai' : configuredMarketplace);
export const APPTOPIA_MARKETPLACE_URL = marketplaceOrigin ? `${marketplaceOrigin}/marketplace` : '';

export function forgeWebUrlForApi(apiUrl: string): string {
  const origin = httpsOrigin(apiUrl);
  if (origin === OFFICIAL_FORGE_ORIGIN) return `${OFFICIAL_FORGE_ORIGIN}/?lang=zh`;
  if (origin && origin === pairedApiOrigin && pairedWebOrigin) return `${pairedWebOrigin}/?lang=zh`;
  return '';
}

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

export interface NativeScreenCapture {
  screenshot: string;
  captureId: string;
  width: number;
  height: number;
  captureMode: string;
}

export interface PhoneSessionOptions {
  maxSteps: number;
  planningOnly: boolean;
  allowedPackages: string[];
  confirmationMode: 'every_action' | 'sensitive';
  tokenBudget: number;
  costBudgetUsd: number;
}
