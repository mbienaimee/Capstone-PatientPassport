import { Request, Response, NextFunction } from 'express';
import { metricsService } from '@/services/metricsService';

/**
 * Middleware to automatically track API response times
 */
export const trackResponseTime = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function
  res.end = function(this: Response, ...args: any[]): any {
    const responseTime = Date.now() - startTime;

    // Track metrics asynchronously (don't block response)
    setImmediate(() => {
      metricsService.trackResponseTime({
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('user-agent'),
        ip: req.ip || req.connection.remoteAddress
      }).catch(error => {
        console.error('Failed to track response time:', error);
      });
    });

    // Call original end function
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Middleware to track errors
 */
export const trackErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Track error asynchronously
  setImmediate(() => {
    metricsService.trackError({
      errorType: err.name || 'UnknownError',
      errorMessage: err.message || 'An error occurred',
      errorStack: err.stack,
      endpoint: req.path,
      userId: (req as any).user?.id,
      metadata: {
        method: req.method,
        query: req.query,
        body: req.body,
        statusCode: err.statusCode || 500
      }
    }).catch(error => {
      console.error('Failed to track error:', error);
    });
  });

  next(err);
};
