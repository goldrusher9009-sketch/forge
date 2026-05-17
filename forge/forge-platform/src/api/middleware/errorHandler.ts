import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../types';

export class ErrorHandler {
  static handle(err: Error | ApiError, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', err);

    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        timestamp: new Date(),
      });
    }

    // Handle validation errors
    if ('statusCode' in err && 'message' in err) {
      const statusCode = (err as any).statusCode || 500;
      const message = err.message || 'Internal Server Error';
      return res.status(statusCode).json({
        success: false,
        error: message,
        timestamp: new Date(),
      });
    }

    // Generic error handler
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date(),
    });
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  ErrorHandler.handle(err, req, res, next);
};
