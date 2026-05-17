// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  AGENTS: `${API_BASE_URL}/agents`,
  WORKFLOWS: `${API_BASE_URL}/workflows`,
  QUEUE: `${API_BASE_URL}/queue`,
  HISTORY: `${API_BASE_URL}/history`,
} as const;

// Navigation Items
export const NAV_ITEMS = [
  { name: 'Dashboard', href: '/' },
  { name: 'Agents', href: '/agents' },
  { name: 'Workflows', href: '/workflows' },
  { name: 'Queue', href: '/queue' },
  { name: 'History', href: '/history' },
] as const;

// Available Models
export const MODELS = [
  { value: 'gpt-4', label: 'GPT-4', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
] as const;

// Temperature Presets
export const TEMPERATURE_PRESETS = [
  { label: 'Precise', value: 0 },
  { label: 'Balanced', value: 0.5 },
  { label: 'Creative', value: 1 },
] as const;

// Max Tokens Presets
export const MAX_TOKENS_PRESETS = [512, 1024, 2048, 4096, 8192] as const;

// Status Colors
export const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  running: 'bg-blue-100 text-blue-800',
  queued: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-800',
  pending: 'bg-gray-100 text-gray-800',
  enabled: 'bg-green-100 text-green-800',
  disabled: 'bg-gray-100 text-gray-800',
} as const;

// Feature Flags
export const FEATURES = {
  AGENTS: process.env.NEXT_PUBLIC_ENABLE_AGENT_CREATION !== 'false',
  WORKFLOWS: process.env.NEXT_PUBLIC_ENABLE_WORKFLOW_CREATION !== 'false',
  QUEUE: process.env.NEXT_PUBLIC_ENABLE_QUEUE_MONITORING !== 'false',
  HISTORY: process.env.NEXT_PUBLIC_ENABLE_HISTORY_TRACKING !== 'false',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Polling Intervals (in milliseconds)
export const POLLING = {
  QUEUE_STATUS: 5000, // 5 seconds
  TASK_STATUS: 2000, // 2 seconds
  EXECUTION_STATUS: 3000, // 3 seconds
} as const;
