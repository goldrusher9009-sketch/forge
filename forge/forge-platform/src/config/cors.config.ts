import { CorsOptions } from 'cors';

/**
 * Whitelist of allowed origins for CORS
 * In production, these should come from environment variables
 */
const allowedOrigins = [
  'http://localhost:3000', // Local frontend development
  'http://localhost:3001', // Alternative local port
  'http://localhost:8080', // Alternative local port
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.DASHBOARD_URL || 'http://localhost:3001',
  ...(process.env.ADDITIONAL_ORIGINS ? process.env.ADDITIONAL_ORIGINS.split(',') : []),
];

/**
 * Remove duplicates from allowed origins
 */
const uniqueOrigins = Array.from(new Set(allowedOrigins));

/**
 * CORS configuration for production
 * Implements strict whitelist-based approach
 */
export const corsConfig: CorsOptions = {
  /**
   * Origin validation: only allow whitelisted origins
   */
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (uniqueOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject non-whitelisted origins
    const error = new Error(`CORS policy: origin "${origin}" is not allowed`);
    callback(error);
  },

  /**
   * Allowed HTTP methods
   */
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],

  /**
   * Allowed headers
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Access-Token',
    'X-Refresh-Token',
    'Accept',
    'Accept-Language',
    'Cache-Control',
  ],

  /**
   * Headers exposed to the browser
   */
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Access-Token',
    'X-Refresh-Token',
    'X-Request-Id',
    'Retry-After',
    'Content-Disposition',
  ],

  /**
   * Allow credentials (cookies, authorization headers)
   * Only allow if origin is also specified
   */
  credentials: true,

  /**
   * Maximum age of preflight request cache (in seconds)
   * 24 hours = 86400 seconds
   */
  maxAge: 86400,

  /**
   * Whether to pass CORS preflight response to the next handler
   */
  preflightContinue: false,

  /**
   * HTTP status code to send for successful OPTIONS requests
   */
  optionsSuccessStatus: 200,
};

/**
 * Strict CORS configuration for sensitive endpoints
 * More restrictive than default
 */
export const strictCorsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Only allow specific origins for sensitive endpoints
    const sensitiveOrigins = [process.env.FRONTEND_URL];
    
    if (!origin || sensitiveOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this endpoint'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600, // 1 hour
};

/**
 * Permissive CORS configuration for public endpoints
 * Use with caution; only for truly public APIs
 */
export const permissiveCorsConfig: CorsOptions = {
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 600, // 10 minutes
};

/**
 * CORS configuration for webhooks
 * Allows incoming webhook requests from external sources
 */
export const webhookCorsConfig: CorsOptions = {
  origin: true, // Allow all origins for webhooks
  methods: ['POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Signature', 'X-Webhook-Id'],
  credentials: false,
  maxAge: 300,
};

/**
 * Validate origin against whitelist
 * Useful for programmatic CORS decisions
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests without origin
  return uniqueOrigins.includes(origin);
};

/**
 * Get allowed origins from environment
 */
export const getAllowedOrigins = (): string[] => {
  return uniqueOrigins;
};

/**
 * Add a new origin to the whitelist at runtime
 */
export const addAllowedOrigin = (origin: string): void => {
  if (!uniqueOrigins.includes(origin)) {
    uniqueOrigins.push(origin);
  }
};

/**
 * Remove an origin from the whitelist at runtime
 */
export const removeAllowedOrigin = (origin: string): void => {
  const index = uniqueOrigins.indexOf(origin);
  if (index > -1) {
    uniqueOrigins.splice(index, 1);
  }
};

/**
 * Middleware to log CORS violations
 */
export const corsLoggingMiddleware = (err: any, req: any, res: any, next: any) => {
  if (err.message && err.message.includes('CORS')) {
    console.warn(`[CORS Violation] Origin: ${req.headers.origin}, Method: ${req.method}, URL: ${req.url}`);
  }
  next(err);
};

export default corsConfig;
