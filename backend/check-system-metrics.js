/**
 * System Metrics Checker
 * 
 * This script checks accuracy, response time, and usability scores
 * 
 * Usage:
 *   node check-system-metrics.js [period]
 *   
 * Examples:
 *   node check-system-metrics.js           # Last 24 hours (default)
 *   node check-system-metrics.js hour      # Last hour
 *   node check-system-metrics.js week      # Last week
 *   node check-system-metrics.js month     # Last month
 */

require('dotenv').config();
const mongoose = require('mongoose');

const SystemMetrics = require('./dist/models/SystemMetrics').default;

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const period = process.argv[2] || 'day';
    const validPeriods = ['hour', 'day', 'week', 'month'];

    if (!validPeriods.includes(period)) {
      console.log(`❌ Invalid period: ${period}`);
      console.log(`Valid options: ${validPeriods.join(', ')}\n`);
      process.exit(1);
    }

    // Calculate date range
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

    console.log('='.repeat(60));
    console.log(`  SYSTEM METRICS REPORT - Last ${period.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`Period: ${startDate.toLocaleString()} to ${now.toLocaleString()}\n`);

    // 1. Response Time Metrics
    console.log('📊 RESPONSE TIME METRICS');
    console.log('-'.repeat(60));

    const responseTimeMetrics = await SystemMetrics.aggregate([
      {
        $match: {
          metricType: 'response_time',
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    if (responseTimeMetrics.length > 0) {
      const rt = responseTimeMetrics[0];
      console.log(`Average Response Time: ${rt.avgResponseTime.toFixed(2)} ms`);
      console.log(`Fastest Response:      ${rt.minResponseTime.toFixed(2)} ms`);
      console.log(`Slowest Response:      ${rt.maxResponseTime.toFixed(2)} ms`);
      console.log(`Total Requests:        ${rt.totalRequests}`);
      
      // Grade response time
      const avgTime = rt.avgResponseTime;
      let grade = 'F';
      if (avgTime < 100) grade = 'A+ (Excellent)';
      else if (avgTime < 300) grade = 'A (Very Good)';
      else if (avgTime < 500) grade = 'B (Good)';
      else if (avgTime < 1000) grade = 'C (Fair)';
      else if (avgTime < 2000) grade = 'D (Poor)';
      
      console.log(`Performance Grade:     ${grade}`);
    } else {
      console.log('No response time data available for this period.');
    }

    // 2. Accuracy Metrics
    console.log('\n\n✅ ACCURACY METRICS');
    console.log('-'.repeat(60));

    const accuracyMetrics = await SystemMetrics.aggregate([
      {
        $match: {
          metricType: 'accuracy',
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accurate: { $sum: { $cond: ['$isAccurate', 1, 0] } },
          avgScore: { $avg: '$accuracyScore' }
        }
      }
    ]);

    if (accuracyMetrics.length > 0) {
      const acc = accuracyMetrics[0];
      const accuracyPercent = (acc.accurate / acc.total) * 100;
      
      console.log(`Total Operations:      ${acc.total}`);
      console.log(`Accurate Operations:   ${acc.accurate}`);
      console.log(`Accuracy Rate:         ${accuracyPercent.toFixed(2)}%`);
      console.log(`Average Score:         ${acc.avgScore ? acc.avgScore.toFixed(2) : 'N/A'}/100`);
      
      // Grade accuracy
      let grade = 'F';
      if (accuracyPercent >= 99) grade = 'A+ (Excellent)';
      else if (accuracyPercent >= 95) grade = 'A (Very Good)';
      else if (accuracyPercent >= 90) grade = 'B (Good)';
      else if (accuracyPercent >= 80) grade = 'C (Fair)';
      else if (accuracyPercent >= 70) grade = 'D (Poor)';
      
      console.log(`Accuracy Grade:        ${grade}`);
    } else {
      console.log('No accuracy data available for this period.');
      console.log('Note: Accuracy tracking needs to be implemented in your code.');
    }

    // 3. Usability Metrics
    console.log('\n\n👤 USABILITY METRICS');
    console.log('-'.repeat(60));

    const usabilityMetrics = await SystemMetrics.aggregate([
      {
        $match: {
          metricType: 'usability',
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          avgSatisfaction: { $avg: '$satisfactionScore' },
          avgCompletionTime: { $avg: '$completionTime' },
          avgClickCount: { $avg: '$clickCount' },
          avgErrorCount: { $avg: '$errorCount' },
          totalInteractions: { $sum: 1 }
        }
      }
    ]);

    if (usabilityMetrics.length > 0) {
      const usab = usabilityMetrics[0];
      
      console.log(`Total Interactions:    ${usab.totalInteractions}`);
      console.log(`Avg Satisfaction:      ${usab.avgSatisfaction ? usab.avgSatisfaction.toFixed(2) : 'N/A'}/5.00`);
      console.log(`Avg Completion Time:   ${usab.avgCompletionTime ? usab.avgCompletionTime.toFixed(0) : 'N/A'} ms`);
      console.log(`Avg Clicks per Task:   ${usab.avgClickCount ? usab.avgClickCount.toFixed(2) : 'N/A'}`);
      console.log(`Avg Errors per Task:   ${usab.avgErrorCount ? usab.avgErrorCount.toFixed(2) : 'N/A'}`);
      
      // Calculate usability score
      if (usab.avgSatisfaction) {
        const satisfactionScore = (usab.avgSatisfaction / 5) * 50;
        const timeScore = Math.max(0, 25 - (usab.avgCompletionTime / 1000));
        const errorScore = Math.max(0, 25 - (usab.avgErrorCount * 5));
        const usabilityScore = Math.min(100, satisfactionScore + timeScore + errorScore);
        
        console.log(`Usability Score:       ${usabilityScore.toFixed(2)}/100`);
        
        let grade = 'F';
        if (usabilityScore >= 90) grade = 'A+ (Excellent)';
        else if (usabilityScore >= 80) grade = 'A (Very Good)';
        else if (usabilityScore >= 70) grade = 'B (Good)';
        else if (usabilityScore >= 60) grade = 'C (Fair)';
        else if (usabilityScore >= 50) grade = 'D (Poor)';
        
        console.log(`Usability Grade:       ${grade}`);
      }
    } else {
      console.log('No usability data available for this period.');
      console.log('Note: Users need to submit feedback for usability tracking.');
    }

    // 4. Error Metrics
    console.log('\n\n❌ ERROR METRICS');
    console.log('-'.repeat(60));

    const errorCount = await SystemMetrics.countDocuments({
      metricType: 'error',
      timestamp: { $gte: startDate, $lte: now }
    });

    const errorsByType = await SystemMetrics.aggregate([
      {
        $match: {
          metricType: 'error',
          timestamp: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$errorType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    console.log(`Total Errors:          ${errorCount}`);
    
    if (errorsByType.length > 0) {
      console.log('\nTop Error Types:');
      errorsByType.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err._id}: ${err.count} occurrences`);
      });
    }

    // 5. Overall System Health
    console.log('\n\n🏥 OVERALL SYSTEM HEALTH');
    console.log('-'.repeat(60));

    let healthScore = 0;
    let componentCount = 0;

    if (responseTimeMetrics.length > 0) {
      const rtScore = Math.max(0, 100 - (responseTimeMetrics[0].avgResponseTime / 10));
      healthScore += rtScore;
      componentCount++;
      console.log(`Response Time Score:   ${rtScore.toFixed(2)}/100`);
    }

    if (accuracyMetrics.length > 0) {
      const accScore = (accuracyMetrics[0].accurate / accuracyMetrics[0].total) * 100;
      healthScore += accScore;
      componentCount++;
      console.log(`Accuracy Score:        ${accScore.toFixed(2)}/100`);
    }

    if (usabilityMetrics.length > 0 && usabilityMetrics[0].avgSatisfaction) {
      const usab = usabilityMetrics[0];
      const satisfactionScore = (usab.avgSatisfaction / 5) * 50;
      const timeScore = Math.max(0, 25 - (usab.avgCompletionTime / 1000));
      const errorScore = Math.max(0, 25 - (usab.avgErrorCount * 5));
      const usabilityScore = Math.min(100, satisfactionScore + timeScore + errorScore);
      
      healthScore += usabilityScore;
      componentCount++;
      console.log(`Usability Score:       ${usabilityScore.toFixed(2)}/100`);
    }

    const errorScore = Math.max(0, 100 - errorCount);
    healthScore += errorScore;
    componentCount++;
    console.log(`Error Score:           ${errorScore.toFixed(2)}/100`);

    if (componentCount > 0) {
      const overallHealth = healthScore / componentCount;
      console.log('\n' + '='.repeat(60));
      console.log(`OVERALL HEALTH SCORE:  ${overallHealth.toFixed(2)}/100`);
      
      let status = '';
      if (overallHealth >= 90) status = '🟢 EXCELLENT';
      else if (overallHealth >= 75) status = '🟡 GOOD';
      else if (overallHealth >= 60) status = '🟠 FAIR';
      else status = '🔴 NEEDS IMPROVEMENT';
      
      console.log(`Status:                ${status}`);
      console.log('='.repeat(60));
    }

    console.log('\n💡 TIP: Track metrics using the API endpoints:');
    console.log('   GET  /api/metrics/health');
    console.log('   GET  /api/metrics/dashboard');
    console.log('   GET  /api/metrics/response-time');
    console.log('   GET  /api/metrics/accuracy');
    console.log('   GET  /api/metrics/usability');
    console.log('   POST /api/metrics/usability (for user feedback)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

main();
