import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { ErrorHandler } from '../utils/errors';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitStore {
  requests: number;
  resetTime: number;
}

export class RateLimitMiddleware {
  private redis: Redis;
  private config: RateLimitConfig;
  private keyPrefix: string;

  constructor(redis: Redis, config: RateLimitConfig, keyPrefix = 'ratelimit') {
    this.redis = redis;
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
    this.keyPrefix = keyPrefix;
  }

  /**
   * Default key generator: IP address + User ID (if authenticated)
   */
  private defaultKeyGenerator(req: Request): string {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.config.keyGenerator
          ? this.config.keyGenerator(req)
          : this.defaultKeyGenerator(req);

        const fullKey = `${this.keyPrefix}:${key}`;
        const current = await this.redis.incr(fullKey);

        // Set expiration on first request
        if (current === 1) {
          await this.redis.pexpire(fullKey, this.config.windowMs);
        }

        // Get remaining TTL
        const ttl = await this.redis.pttl(fullKey);
        const resetTime = Date.now() + ttl;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - current));
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
        res.setHeader('Retry-After', Math.ceil(ttl / 1000));

        // Check if limit exceeded
        if (current > this.config.maxRequests) {
          throw new ErrorHandler(
            429,
            'RATE_LIMITED',
            this.config.message || 'Too many requests, please try again later',
            { retryAfter: Math.ceil(ttl / 1000) }
          );
        }

        // Optional: Skip on successful responses
        if (this.config.skipSuccessfulRequests) {
          const originalJson = res.json.bind(res);
          res.json = function(data: any) {
            // If successful response, decrement the counter
            if (res.statusCode >= 200 && res.statusCode < 300) {
              (this as any).redis.decr(fullKey).catch(() => {});
            }
            return originalJson(data);
          };
        }

        next();
      } catch (error) {
        if (error instanceof ErrorHandler) {
          res.status(error.statusCode).json({
            code: error.code,
            message: error.message,
            ...(error.metadata && { details: error.metadata }),
          });
        } else {
          next(error);
        }
      }
    };
  }
}

/**
 * Pre-configured rate limit strategies
 */
export class RateLimitStrategies {
  constructor(private redis: Redis) {}

  /**
   * Global rate limit: 1000 requests per 15 minutes per IP
   */
  global() {
    return new RateLimitMiddleware(this.redis, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 1000,
      message: 'Global rate limit exceeded',
    }).middleware();
  }

  /**
   * Auth endpoints: 5 requests per 15 minutes per IP
   * (prevents brute force attacks)
   */
  authEndpoints() {
    return new RateLimitMiddleware(this.redis, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      message: 'Too many authentication attempts, please try again later',
    }).middleware();
  }

  /**
   * API endpoints: 100 requests per minute per user
   */
  apiEndpoints() {
    return new RateLimitMiddleware(this.redis, {
      windowMs: 60 * 1000,
      maxRequests: 100,
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userId = (req as any).user?.id || 'anonymous';
        return `${ip}:${userId}`;
      },
      message: 'API rate limit exceeded',
    }).middleware();
  }

  /**
   * Webhook endpoints: 500 requests per hour per webhook
   */
  webhookEndpoints() {
    return new RateLimitMiddleware(this.redis, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 500,
      keyGenerator: (req: Request) => {
        // Use webhook ID or source IP
        const webhookId = (req as any).webhookId || req.ip || 'unknown';
        return `webhook:${webhookId}`;
      },
      message: 'Webhook rate limit exceeded',
    }).middleware();
  }

  /**
   * File upload: 10 uploads per hour per user
   */
  fileUpload() {
    return new RateLimitMiddleware(this.redis, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id || req.ip || 'unknown';
        return `upload:${userId}`;
      },
      message: 'Upload limit exceeded',
    }).middleware();
  }

  /**
   * Workflow execution: 50 executions per hour per user
   */
  workflowExecution() {
    return new RateLimitMiddleware(this.redis, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 50,
      keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id;
        const workflowId = (req as any).params?.workflowId;
        return `execution:${userId}:${workflowId}`;
      },
      message: 'Workflow execution limit exceeded',
    }).middleware();
  }

  /**
   * Custom strategy
   */
  custom(config: RateLimitConfig) {
    return new RateLimitMiddleware(this.redis, config).middleware();
  }
}

export default RateLimitMiddleware;
