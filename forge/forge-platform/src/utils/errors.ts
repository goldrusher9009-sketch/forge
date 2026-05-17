/**
 * Standardized error codes for the Forge platform
 */
export enum ErrorCode {
  // Validation errors (400)
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Authentication errors (401)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  MFA_REQUIRED = 'MFA_REQUIRED',
  INVALID_MFA_CODE = 'INVALID_MFA_CODE',

  // Authorization errors (403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED = 'ROLE_REQUIRED',

  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  API_KEY_NOT_FOUND = 'API_KEY_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_API_KEY = 'DUPLICATE_API_KEY',
  CONFLICT = 'CONFLICT',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  AUTH_RATE_LIMIT = 'AUTH_RATE_LIMIT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  WORKFLOW_EXECUTION_ERROR = 'WORKFLOW_EXECUTION_ERROR',
  AGENT_ERROR = 'AGENT_ERROR',

  // Custom errors
  OPERATION_FAILED = 'OPERATION_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  TIMEOUT = 'TIMEOUT',
}

/**
 * HTTP status code mapping for error codes
 */
const ErrorCodeStatusMap: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_PASSWORD]: 400,
  [ErrorCode.PASSWORD_MISMATCH]: 400,
  [ErrorCode.VALIDATION_FAILED]: 400,

  // 401 Unauthorized
  [ErrorCode.AUTHENTICATION_REQUIRED]: 401,
  [ErrorCode.AUTHENTICATION_FAILED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_REFRESH_TOKEN]: 401,
  [ErrorCode.MFA_REQUIRED]: 401,
  [ErrorCode.INVALID_MFA_CODE]: 401,

  // 403 Forbidden
  [ErrorCode.UNAUTHORIZED]: 403,
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.ROLE_REQUIRED]: 403,

  // 404 Not Found
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.WORKFLOW_NOT_FOUND]: 404,
  [ErrorCode.AGENT_NOT_FOUND]: 404,
  [ErrorCode.API_KEY_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCode.RESOURCE_EXISTS]: 409,
  [ErrorCode.DUPLICATE_EMAIL]: 409,
  [ErrorCode.DUPLICATE_API_KEY]: 409,
  [ErrorCode.CONFLICT]: 409,

  // 429 Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.AUTH_RATE_LIMIT]: 429,
  [ErrorCode.API_RATE_LIMIT]: 429,

  // 500 Internal Server Error
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.ENCRYPTION_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 500,
  [ErrorCode.WORKFLOW_EXECUTION_ERROR]: 500,
  [ErrorCode.AGENT_ERROR]: 500,
  [ErrorCode.OPERATION_FAILED]: 500,
  [ErrorCode.INVALID_STATE]: 500,
  [ErrorCode.TIMEOUT]: 500,
};

/**
 * Custom AppError class for application-specific errors
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = ErrorCodeStatusMap[code] || 500;
    this.details = details;
    this.timestamp = new Date();

    // Maintain proper stack trace for where error was thrown (only available in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON response format
   */
  public toJSON() {
    return {
      success: false,
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp,
    };
  }
}

/**
 * Error factory functions for common errors
 */
export const Errors = {
  // Validation errors
  invalidInput: (message: string, details?: Record<string, any>) =>
    new AppError(ErrorCode.INVALID_INPUT, message, details),

  invalidEmail: () =>
    new AppError(ErrorCode.INVALID_EMAIL, 'Invalid email format'),

  invalidPassword: (requirements?: string) =>
    new AppError(
      ErrorCode.INVALID_PASSWORD,
      requirements || 'Password does not meet security requirements'
    ),

  passwordMismatch: () =>
    new AppError(ErrorCode.PASSWORD_MISMATCH, 'Passwords do not match'),

  validationFailed: (details: Record<string, any>) =>
    new AppError(ErrorCode.VALIDATION_FAILED, 'Validation failed', details),

  // Authentication errors
  authenticationRequired: () =>
    new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'Authentication required'),

  authenticationFailed: () =>
    new AppError(ErrorCode.AUTHENTICATION_FAILED, 'Authentication failed'),

  invalidCredentials: () =>
    new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password'),

  invalidToken: () =>
    new AppError(ErrorCode.INVALID_TOKEN, 'Invalid or malformed token'),

  tokenExpired: () =>
    new AppError(ErrorCode.TOKEN_EXPIRED, 'Token has expired'),

  invalidRefreshToken: () =>
    new AppError(ErrorCode.INVALID_REFRESH_TOKEN, 'Invalid refresh token'),

  mfaRequired: () =>
    new AppError(ErrorCode.MFA_REQUIRED, 'Multi-factor authentication required'),

  invalidMfaCode: () =>
    new AppError(ErrorCode.INVALID_MFA_CODE, 'Invalid MFA code'),

  // Authorization errors
  unauthorized: (message?: string) =>
    new AppError(ErrorCode.UNAUTHORIZED, message || 'Unauthorized'),

  permissionDenied: () =>
    new AppError(ErrorCode.PERMISSION_DENIED, 'Permission denied'),

  forbidden: () =>
    new AppError(ErrorCode.FORBIDDEN, 'Forbidden'),

  insufficientPermissions: (permission?: string) =>
    new AppError(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      permission
        ? `Insufficient permissions: ${permission}`
        : 'Insufficient permissions'
    ),

  roleRequired: (role: string) =>
    new AppError(ErrorCode.ROLE_REQUIRED, `Role required: ${role}`),

  // Resource not found errors
  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`),

  userNotFound: () =>
    new AppError(ErrorCode.USER_NOT_FOUND, 'User not found'),

  workflowNotFound: () =>
    new AppError(ErrorCode.WORKFLOW_NOT_FOUND, 'Workflow not found'),

  agentNotFound: () =>
    new AppError(ErrorCode.AGENT_NOT_FOUND, 'Agent not found'),

  apiKeyNotFound: () =>
    new AppError(ErrorCode.API_KEY_NOT_FOUND, 'API key not found'),

  // Conflict errors
  resourceExists: (resource: string) =>
    new AppError(ErrorCode.RESOURCE_EXISTS, `${resource} already exists`),

  duplicateEmail: () =>
    new AppError(ErrorCode.DUPLICATE_EMAIL, 'Email already in use'),

  duplicateApiKey: () =>
    new AppError(ErrorCode.DUPLICATE_API_KEY, 'API key already exists'),

  conflict: (message: string) =>
    new AppError(ErrorCode.CONFLICT, message),

  // Rate limiting errors
  rateLimitExceeded: (retryAfter?: number) =>
    new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      retryAfter ? { retryAfter } : undefined
    ),

  tooManyRequests: (retryAfter?: number) =>
    new AppError(
      ErrorCode.TOO_MANY_REQUESTS,
      'Too many requests',
      retryAfter ? { retryAfter } : undefined
    ),

  authRateLimit: () =>
    new AppError(
      ErrorCode.AUTH_RATE_LIMIT,
      'Too many authentication attempts. Please try again later.'
    ),

  apiRateLimit: (retryAfter?: number) =>
    new AppError(
      ErrorCode.API_RATE_LIMIT,
      'API rate limit exceeded',
      retryAfter ? { retryAfter } : undefined
    ),

  // Server errors
  internalError: (message?: string) =>
    new AppError(
      ErrorCode.INTERNAL_ERROR,
      message || 'Internal server error'
    ),

  databaseError: (message?: string) =>
    new AppError(
      ErrorCode.DATABASE_ERROR,
      message || 'Database operation failed'
    ),

  encryptionError: (message?: string) =>
    new AppError(
      ErrorCode.ENCRYPTION_ERROR,
      message || 'Encryption operation failed'
    ),

  externalServiceError: (service: string) =>
    new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} service error`
    ),

  workflowExecutionError: (message?: string) =>
    new AppError(
      ErrorCode.WORKFLOW_EXECUTION_ERROR,
      message || 'Workflow execution failed'
    ),

  agentError: (message?: string) =>
    new AppError(
      ErrorCode.AGENT_ERROR,
      message || 'Agent operation failed'
    ),

  operationFailed: (operation: string) =>
    new AppError(
      ErrorCode.OPERATION_FAILED,
      `${operation} operation failed`
    ),

  invalidState: (message: string) =>
    new AppError(ErrorCode.INVALID_STATE, message),

  timeout: () =>
    new AppError(ErrorCode.TIMEOUT, 'Operation timeout'),
};

/**
 * Error handler middleware
 */
export function errorHandler(
  err: any,
  req: any,
  res: any,
  next: any
) {
  // Log error
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Convert known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle unexpected errors
  const unexpectedError = new AppError(
    ErrorCode.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  );

  res.status(unexpectedError.statusCode).json(unexpectedError.toJSON());
}

/**
 * Async error wrapper for Express routes
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  ErrorCode,
  AppError,
  Errors,
  errorHandler,
  asyncHandler,
};
