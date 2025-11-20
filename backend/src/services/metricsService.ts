import SystemMetrics from '@/models/SystemMetrics';
import { Schema } from 'mongoose';

/**
 * Metrics Service
 * Handles tracking and analysis of system metrics
 */

class MetricsService {
  /**
   * Track API response time
   */
  async trackResponseTime(data: {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    userAgent?: string;
    ip?: string;
  }): Promise<void> {
    try {
      await SystemMetrics.create({
        metricType: 'response_time',
        timestamp: new Date(),
        ...data
      });
    } catch (error) {
      console.error('❌ Error tracking response time:', error);
    }
  }

  /**
   * Track data accuracy
   */
  async trackAccuracy(data: {
    operation: string;
    expectedResult?: any;
    actualResult?: any;
    isAccurate: boolean;
    accuracyScore?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await SystemMetrics.create({
        metricType: 'accuracy',
        timestamp: new Date(),
        ...data
      });
    } catch (error) {
      console.error('❌ Error tracking accuracy:', error);
    }
  }

  /**
   * Track usability metrics
   */
  async trackUsability(data: {
    userId?: string | Schema.Types.ObjectId;
    userRole?: 'patient' | 'doctor' | 'hospital';
    action: string;
    completionTime?: number;
    clickCount?: number;
    errorCount?: number;
    satisfactionScore?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await SystemMetrics.create({
        metricType: 'usability',
        timestamp: new Date(),
        ...data
      });
    } catch (error) {
      console.error('❌ Error tracking usability:', error);
    }
  }

  /**
   * Track errors
   */
  async trackError(data: {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    endpoint?: string;
    userId?: string | Schema.Types.ObjectId;
    metadata?: any;
  }): Promise<void> {
    try {
      await SystemMetrics.create({
        metricType: 'error',
        timestamp: new Date(),
        ...data
      });
    } catch (error) {
      console.error('❌ Error tracking error metric:', error);
    }
  }

  /**
   * Get average response time
   */
  async getAverageResponseTime(filters?: {
    endpoint?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const query: any = { metricType: 'response_time' };
    
    if (filters?.endpoint) {
      query.endpoint = filters.endpoint;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const result = await SystemMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    return result[0]?.avgResponseTime || 0;
  }

  /**
   * Get accuracy score
   */
  async getAccuracyScore(filters?: {
    operation?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const query: any = { metricType: 'accuracy' };
    
    if (filters?.operation) {
      query.operation = filters.operation;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const result = await SystemMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accurate: { $sum: { $cond: ['$isAccurate', 1, 0] } },
          avgScore: { $avg: '$accuracyScore' }
        }
      }
    ]);

    if (!result[0]) return 100; // Default to 100% if no data

    // Return percentage of accurate operations
    const accuracy = (result[0].accurate / result[0].total) * 100;
    return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get usability score
   */
  async getUsabilityScore(filters?: {
    userRole?: 'patient' | 'doctor' | 'hospital';
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    averageSatisfaction: number;
    averageCompletionTime: number;
    averageErrorCount: number;
    totalInteractions: number;
    usabilityScore: number;
  }> {
    const query: any = { metricType: 'usability' };
    
    if (filters?.userRole) {
      query.userRole = filters.userRole;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const result = await SystemMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgSatisfaction: { $avg: '$satisfactionScore' },
          avgCompletionTime: { $avg: '$completionTime' },
          avgErrorCount: { $avg: '$errorCount' },
          totalInteractions: { $sum: 1 }
        }
      }
    ]);

    if (!result[0]) {
      return {
        averageSatisfaction: 0,
        averageCompletionTime: 0,
        averageErrorCount: 0,
        totalInteractions: 0,
        usabilityScore: 0
      };
    }

    const data = result[0];
    
    // Calculate usability score (0-100)
    // Based on: satisfaction (50%), low completion time (25%), low errors (25%)
    const satisfactionScore = (data.avgSatisfaction / 5) * 50; // Out of 50
    const timeScore = Math.max(0, 25 - (data.avgCompletionTime / 1000)); // Faster is better
    const errorScore = Math.max(0, 25 - (data.avgErrorCount * 5)); // Fewer errors is better
    
    const usabilityScore = Math.min(100, satisfactionScore + timeScore + errorScore);

    return {
      averageSatisfaction: Math.round(data.avgSatisfaction * 100) / 100,
      averageCompletionTime: Math.round(data.avgCompletionTime),
      averageErrorCount: Math.round(data.avgErrorCount * 100) / 100,
      totalInteractions: data.totalInteractions,
      usabilityScore: Math.round(usabilityScore * 100) / 100
    };
  }

  /**
   * Get comprehensive system health report
   */
  async getSystemHealthReport(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'hour':
        startDate.setHours(now.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const [responseTime, accuracy, usability, errorCount] = await Promise.all([
      this.getAverageResponseTime({ startDate, endDate: now }),
      this.getAccuracyScore({ startDate, endDate: now }),
      this.getUsabilityScore({ startDate, endDate: now }),
      SystemMetrics.countDocuments({
        metricType: 'error',
        timestamp: { $gte: startDate, $lte: now }
      })
    ]);

    // Calculate overall health score (0-100)
    const responseTimeScore = Math.max(0, 100 - (responseTime / 10)); // Penalize slow responses
    const accuracyScore = accuracy;
    const usabilityScoreValue = usability.usabilityScore;
    const errorScore = Math.max(0, 100 - errorCount); // Penalize errors

    const overallHealth = (responseTimeScore * 0.3 + accuracyScore * 0.3 + usabilityScoreValue * 0.3 + errorScore * 0.1);

    return {
      period,
      startDate,
      endDate: now,
      metrics: {
        averageResponseTime: Math.round(responseTime * 100) / 100,
        accuracyScore: Math.round(accuracy * 100) / 100,
        usabilityScore: Math.round(usability.usabilityScore * 100) / 100,
        errorCount,
        totalRequests: await SystemMetrics.countDocuments({
          metricType: 'response_time',
          timestamp: { $gte: startDate, $lte: now }
        })
      },
      health: {
        overallScore: Math.round(overallHealth * 100) / 100,
        status: overallHealth >= 80 ? 'excellent' : overallHealth >= 60 ? 'good' : overallHealth >= 40 ? 'fair' : 'poor',
        responseTimeScore: Math.round(responseTimeScore * 100) / 100,
        accuracyScore: Math.round(accuracyScore * 100) / 100,
        usabilityScore: Math.round(usabilityScoreValue * 100) / 100,
        errorScore: Math.round(errorScore * 100) / 100
      },
      details: {
        usability
      }
    };
  }

  /**
   * Get endpoint performance breakdown
   */
  async getEndpointPerformance(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query: any = { metricType: 'response_time' };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    return await SystemMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: { endpoint: '$endpoint', method: '$method' },
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          totalRequests: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $lt: ['$statusCode', 400] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          endpoint: '$_id.endpoint',
          method: '$_id.method',
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          minResponseTime: 1,
          maxResponseTime: 1,
          totalRequests: 1,
          successRate: {
            $round: [{ $multiply: [{ $divide: ['$successCount', '$totalRequests'] }, 100] }, 2]
          }
        }
      },
      { $sort: { avgResponseTime: -1 } }
    ]);
  }
}

export const metricsService = new MetricsService();
