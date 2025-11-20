import { Request, Response } from 'express';
import { metricsService } from '@/services/metricsService';
import { asyncHandler } from '@/middleware/errorHandler';
import SystemMetrics from '@/models/SystemMetrics';

/**
 * @desc    Get system health report
 * @route   GET /api/metrics/health
 * @access  Private (Admin only)
 */
export const getSystemHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const period = (req.query.period as 'hour' | 'day' | 'week' | 'month') || 'day';

  const report = await metricsService.getSystemHealthReport(period);

  res.json({
    success: true,
    data: report
  });
});

/**
 * @desc    Get average response time
 * @route   GET /api/metrics/response-time
 * @access  Private (Admin only)
 */
export const getResponseTime = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { endpoint, startDate, endDate } = req.query;

  const filters: any = {};
  if (endpoint) filters.endpoint = endpoint;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const avgResponseTime = await metricsService.getAverageResponseTime(filters);

  res.json({
    success: true,
    data: {
      averageResponseTime: avgResponseTime,
      unit: 'milliseconds',
      filters
    }
  });
});

/**
 * @desc    Get accuracy score
 * @route   GET /api/metrics/accuracy
 * @access  Private (Admin only)
 */
export const getAccuracy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { operation, startDate, endDate } = req.query;

  const filters: any = {};
  if (operation) filters.operation = operation;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const accuracyScore = await metricsService.getAccuracyScore(filters);

  res.json({
    success: true,
    data: {
      accuracyScore,
      percentage: accuracyScore,
      filters
    }
  });
});

/**
 * @desc    Get usability score
 * @route   GET /api/metrics/usability
 * @access  Private (Admin only)
 */
export const getUsability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userRole, startDate, endDate } = req.query;

  const filters: any = {};
  if (userRole) filters.userRole = userRole as 'patient' | 'doctor' | 'hospital';
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const usabilityData = await metricsService.getUsabilityScore(filters);

  res.json({
    success: true,
    data: usabilityData
  });
});

/**
 * @desc    Get endpoint performance
 * @route   GET /api/metrics/endpoints
 * @access  Private (Admin only)
 */
export const getEndpointPerformance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : undefined;
  const end = endDate ? new Date(endDate as string) : undefined;

  const performance = await metricsService.getEndpointPerformance(start, end);

  res.json({
    success: true,
    data: performance
  });
});

/**
 * @desc    Track custom usability metric
 * @route   POST /api/metrics/usability
 * @access  Private
 */
export const trackUsabilityMetric = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    action,
    completionTime,
    clickCount,
    errorCount,
    satisfactionScore,
    metadata
  } = req.body;

  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;

  await metricsService.trackUsability({
    userId,
    userRole,
    action,
    completionTime,
    clickCount,
    errorCount,
    satisfactionScore,
    metadata
  });

  res.status(201).json({
    success: true,
    message: 'Usability metric tracked successfully'
  });
});

/**
 * @desc    Track custom accuracy metric
 * @route   POST /api/metrics/accuracy
 * @access  Private (Admin only)
 */
export const trackAccuracyMetric = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    operation,
    expectedResult,
    actualResult,
    isAccurate,
    accuracyScore,
    metadata
  } = req.body;

  await metricsService.trackAccuracy({
    operation,
    expectedResult,
    actualResult,
    isAccurate,
    accuracyScore,
    metadata
  });

  res.status(201).json({
    success: true,
    message: 'Accuracy metric tracked successfully'
  });
});

/**
 * @desc    Get metrics dashboard data
 * @route   GET /api/metrics/dashboard
 * @access  Private (Admin only)
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const period = (req.query.period as 'hour' | 'day' | 'week' | 'month') || 'day';

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

  const [health, endpoints, recentErrors] = await Promise.all([
    metricsService.getSystemHealthReport(period),
    metricsService.getEndpointPerformance(startDate, now),
    SystemMetrics.find({
      metricType: 'error',
      timestamp: { $gte: startDate, $lte: now }
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('timestamp errorType errorMessage endpoint')
  ]);

  res.json({
    success: true,
    data: {
      health,
      topEndpoints: endpoints.slice(0, 10),
      recentErrors,
      period
    }
  });
});
