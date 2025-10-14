import { Request, Response, NextFunction } from 'express';

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Call original end method with proper arguments
    if (typeof chunk === 'function') {
      return originalEnd.call(this, chunk);
    } else if (typeof encoding === 'function') {
      return originalEnd.call(this, chunk, encoding);
    } else {
      return originalEnd.call(this, chunk, encoding, cb);
    }
  };
  
  next();
};

// Database query performance monitoring
export const logSlowQueries = (query: any, duration: number) => {
  if (duration > 100) { // Log queries taking more than 100ms
    console.warn(`🐌 Slow database query: ${query.op} - ${duration}ms`);
  }
};

// Memory usage monitoring
export const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const total = used.heapTotal;
  const usedPercent = (used.heapUsed / total) * 100;
  
  if (usedPercent > 80) {
    console.warn(`⚠️ High memory usage: ${usedPercent.toFixed(2)}%`);
  }
  
  return {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    usedPercent: Math.round(usedPercent * 100) / 100
  };
};

// Performance metrics collection
export class PerformanceMetrics {
  private static instance: PerformanceMetrics;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMetrics {
    if (!PerformanceMetrics.instance) {
      PerformanceMetrics.instance = new PerformanceMetrics();
    }
    return PerformanceMetrics.instance;
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  getMetrics() {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverage(name),
        count: values.length,
        latest: values[values.length - 1] || 0
      };
    }
    
    return result;
  }
}

// Export singleton instance
export const performanceMetrics = PerformanceMetrics.getInstance();
