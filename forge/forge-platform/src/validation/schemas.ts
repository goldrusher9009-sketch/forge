import { z } from 'zod';

/**
 * Authentication & User Schemas
 */
export const loginSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
  password: z
    .string('Password is required')
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  mfaCode: z
    .string('MFA code is required if MFA is enabled')
    .length(6, 'MFA code must be 6 digits')
    .regex(/^\d+$/, 'MFA code must contain only digits')
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
  password: z
    .string('Password is required')
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string('Password confirmation is required'),
  firstName: z
    .string('First name is required')
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be less than 50 characters')
    .transform(val => val.trim()),
  lastName: z
    .string('Last name is required')
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be less than 50 characters')
    .transform(val => val.trim()),
  agreedToTerms: z
    .boolean('You must agree to the terms')
    .refine(val => val === true, 'You must agree to the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string('Current password is required'),
  newPassword: z
    .string('New password is required')
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string('Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const passwordResetSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export const passwordResetConfirmSchema = z.object({
  token: z.string('Reset token is required'),
  newPassword: z
    .string('New password is required')
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string('Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Workflow Schemas
 */
export const workflowCreateSchema = z.object({
  name: z
    .string('Workflow name is required')
    .min(1, 'Workflow name cannot be empty')
    .max(255, 'Workflow name must be less than 255 characters')
    .transform(val => val.trim()),
  description: z
    .string('Workflow description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .transform(val => val.trim()),
  triggers: z
    .array(z.object({
      type: z.enum(['webhook', 'schedule', 'manual', 'event']),
      config: z.record(z.any()).optional(),
    }))
    .min(1, 'At least one trigger is required'),
  steps: z
    .array(z.object({
      id: z.string('Step ID is required'),
      type: z.enum(['action', 'condition', 'loop', 'delay']),
      config: z.record(z.any()),
      nextStepId: z.string().optional(),
    }))
    .min(1, 'At least one step is required'),
  enabled: z.boolean().optional().default(true),
  tags: z
    .array(z.string().max(50))
    .optional()
    .default([]),
});

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;

export const workflowUpdateSchema = workflowCreateSchema.partial();

export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;

export const workflowExecuteSchema = z.object({
  workflowId: z.string('Workflow ID is required'),
  inputs: z.record(z.any()).optional().default({}),
  metadata: z.object({
    source: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

export type WorkflowExecuteInput = z.infer<typeof workflowExecuteSchema>;

/**
 * Agent Schemas
 */
export const agentCreateSchema = z.object({
  name: z
    .string('Agent name is required')
    .min(1, 'Agent name cannot be empty')
    .max(255, 'Agent name must be less than 255 characters')
    .transform(val => val.trim()),
  description: z
    .string('Agent description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .transform(val => val.trim()),
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'local']),
  systemPrompt: z
    .string('System prompt is required')
    .min(10, 'System prompt must be at least 10 characters')
    .max(5000, 'System prompt must be less than 5000 characters'),
  temperature: z
    .number('Temperature must be a number')
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .default(0.7),
  maxTokens: z
    .number('Max tokens must be a number')
    .min(100, 'Max tokens must be at least 100')
    .max(8000, 'Max tokens must be at most 8000')
    .default(2000),
  tools: z
    .array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.any()).optional(),
    }))
    .optional()
    .default([]),
  enabled: z.boolean().optional().default(true),
  tags: z
    .array(z.string().max(50))
    .optional()
    .default([]),
});

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;

export const agentUpdateSchema = agentCreateSchema.partial();

export type AgentUpdateInput = z.infer<typeof agentUpdateSchema>;

/**
 * API Key Schemas
 */
export const apiKeyCreateSchema = z.object({
  name: z
    .string('API key name is required')
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must be less than 255 characters')
    .transform(val => val.trim()),
  scopes: z
    .array(z.enum([
      'read:profile',
      'write:profile',
      'read:workflows',
      'write:workflows',
      'execute:workflows',
      'read:agents',
      'manage:agents',
      'read:analytics',
    ]))
    .min(1, 'At least one scope is required'),
  expiresIn: z
    .enum(['1_day', '7_days', '30_days', '90_days', '1_year', 'never'])
    .optional()
    .default('90_days'),
});

export type APIKeyCreateInput = z.infer<typeof apiKeyCreateSchema>;

/**
 * User Management Schemas
 */
export const userCreateSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .transform(val => val.trim()),
  firstName: z
    .string('First name is required')
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must be less than 50 characters')
    .transform(val => val.trim()),
  lastName: z
    .string('Last name is required')
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must be less than 50 characters')
    .transform(val => val.trim()),
  role: z.enum(['user', 'admin', 'agent', 'service']).default('user'),
  permissions: z.array(z.string()).optional().default([]),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = userCreateSchema.partial();

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/**
 * Generic validation helpers
 */
export function validateInput<T>(
  schema: z.ZodSchema,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path || 'root'] = issue.message;
  }

  return { success: false, errors };
}

/**
 * Validation middleware factory
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const validation = validateInput(schema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        errors: validation.errors,
      });
    }

    req.validatedData = validation.data;
    next();
  };
}

export default {
  loginSchema,
  registerSchema,
  passwordChangeSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
  workflowCreateSchema,
  workflowUpdateSchema,
  workflowExecuteSchema,
  agentCreateSchema,
  agentUpdateSchema,
  apiKeyCreateSchema,
  userCreateSchema,
  userUpdateSchema,
  validateInput,
  validateRequest,
};
