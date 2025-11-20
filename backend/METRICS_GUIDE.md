# System Metrics Monitoring Guide 📊

## Overview

Your Patient Passport system now includes comprehensive metrics tracking for:
- ✅ **Response Time** - API endpoint performance
- ✅ **Accuracy** - Data validation and correctness
- ✅ **Usability** - User experience and satisfaction
- ✅ **Error Tracking** - System errors and failures

---

## Quick Start

### 1. Check Current Metrics

```bash
# Navigate to backend
cd backend

# Check system metrics (last 24 hours)
node check-system-metrics.js

# Check last hour
node check-system-metrics.js hour

# Check last week
node check-system-metrics.js week

# Check last month
node check-system-metrics.js month
```

**Example Output:**
```
==============================================================
  SYSTEM METRICS REPORT - Last DAY
==============================================================

📊 RESPONSE TIME METRICS
--------------------------------------------------------------
Average Response Time: 145.23 ms
Fastest Response:      42.10 ms
Slowest Response:      892.50 ms
Total Requests:        1,247
Performance Grade:     A (Very Good)

✅ ACCURACY METRICS
--------------------------------------------------------------
Total Operations:      542
Accurate Operations:   538
Accuracy Rate:         99.26%
Accuracy Grade:        A+ (Excellent)

👤 USABILITY METRICS
--------------------------------------------------------------
Total Interactions:    89
Avg Satisfaction:      4.2/5.00
Avg Completion Time:   3,245 ms
Avg Clicks per Task:   5.3
Avg Errors per Task:   0.4
Usability Score:       78.5/100
Usability Grade:       B (Good)

🏥 OVERALL SYSTEM HEALTH
--------------------------------------------------------------
OVERALL HEALTH SCORE:  88.4/100
Status:                🟢 EXCELLENT
```

---

## API Endpoints

### 1. Get System Health (Admin Only)

```http
GET /api/metrics/health?period=day
Authorization: Bearer <admin-jwt-token>
```

**Periods:** `hour`, `day`, `week`, `month`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "metrics": {
      "averageResponseTime": 145.23,
      "accuracyScore": 99.26,
      "usabilityScore": 78.5,
      "errorCount": 12,
      "totalRequests": 1247
    },
    "health": {
      "overallScore": 88.4,
      "status": "excellent",
      "responseTimeScore": 85.5,
      "accuracyScore": 99.26,
      "usabilityScore": 78.5,
      "errorScore": 88.0
    }
  }
}
```

---

### 2. Get Dashboard (Admin Only)

```http
GET /api/metrics/dashboard?period=day
Authorization: Bearer <admin-jwt-token>
```

**Response:** Comprehensive dashboard with health, endpoints, and recent errors

---

### 3. Get Response Time (Admin Only)

```http
GET /api/metrics/response-time?endpoint=/api/patients&startDate=2025-11-18&endDate=2025-11-19
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "averageResponseTime": 142.5,
    "unit": "milliseconds",
    "filters": {
      "endpoint": "/api/patients",
      "startDate": "2025-11-18T00:00:00.000Z"
    }
  }
}
```

---

### 4. Get Accuracy Score (Admin Only)

```http
GET /api/metrics/accuracy?operation=patient-sync
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accuracyScore": 98.5,
    "percentage": 98.5,
    "filters": {
      "operation": "patient-sync"
    }
  }
}
```

---

### 5. Get Usability Metrics (Admin Only)

```http
GET /api/metrics/usability?userRole=patient
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "averageSatisfaction": 4.2,
    "averageCompletionTime": 3245,
    "averageErrorCount": 0.4,
    "totalInteractions": 89,
    "usabilityScore": 78.5
  }
}
```

---

### 6. Track Usability (Any Authenticated User)

```http
POST /api/metrics/usability
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "action": "view-patient-passport",
  "completionTime": 2500,
  "clickCount": 3,
  "errorCount": 0,
  "satisfactionScore": 5,
  "metadata": {
    "feature": "passport-view",
    "device": "mobile"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usability metric tracked successfully"
}
```

---

### 7. Get Endpoint Performance (Admin Only)

```http
GET /api/metrics/endpoints
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "endpoint": "/api/patients",
      "method": "GET",
      "avgResponseTime": 125.45,
      "minResponseTime": 42,
      "maxResponseTime": 543,
      "totalRequests": 345,
      "successRate": 98.26
    }
  ]
}
```

---

## Automatic Tracking

### Response Time
**Automatically tracked** for all API requests. No action needed!

The middleware tracks:
- Endpoint path
- HTTP method
- Response time (ms)
- Status code
- User agent
- IP address

---

### Error Tracking
**Automatically tracked** when errors occur. No action needed!

The middleware tracks:
- Error type
- Error message
- Stack trace
- Endpoint
- User ID
- Request metadata

---

## Manual Tracking

### 1. Track Accuracy in Your Code

```typescript
import { metricsService } from '@/services/metricsService';

// Example: Track data sync accuracy
async function syncPatientData(patientId: string) {
  const expected = await getExpectedData(patientId);
  const actual = await fetchFromOpenMRS(patientId);
  
  const isAccurate = JSON.stringify(expected) === JSON.stringify(actual);
  
  await metricsService.trackAccuracy({
    operation: 'patient-sync',
    expectedResult: expected,
    actualResult: actual,
    isAccurate,
    accuracyScore: isAccurate ? 100 : 0,
    metadata: { patientId }
  });
  
  return actual;
}
```

---

### 2. Track Usability from Frontend

```typescript
// React/TypeScript example
import axios from 'axios';

const trackUsability = async (action: string, data: any) => {
  try {
    await axios.post('/api/metrics/usability', {
      action,
      completionTime: data.completionTime,
      clickCount: data.clickCount,
      errorCount: data.errorCount,
      satisfactionScore: data.rating,
      metadata: data.metadata
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  } catch (error) {
    console.error('Failed to track usability:', error);
  }
};

// Track task completion
const handleTaskComplete = () => {
  trackUsability('view-medical-history', {
    completionTime: Date.now() - taskStartTime,
    clickCount: clickCounter,
    errorCount: errorCounter,
    rating: 5,
    metadata: { device: 'mobile' }
  });
};
```

---

## Frontend Integration Examples

### 1. Satisfaction Survey Component

```typescript
// SatisfactionSurvey.tsx
import React, { useState } from 'react';
import axios from 'axios';

export const SatisfactionSurvey: React.FC<{ action: string }> = ({ action }) => {
  const [rating, setRating] = useState(0);

  const submitFeedback = async () => {
    await axios.post('/api/metrics/usability', {
      action,
      satisfactionScore: rating,
      metadata: { timestamp: new Date().toISOString() }
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  };

  return (
    <div>
      <h3>How satisfied are you?</h3>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={() => setRating(star)}>
          {star <= rating ? '⭐' : '☆'}
        </button>
      ))}
      <button onClick={submitFeedback}>Submit</button>
    </div>
  );
};
```

---

### 2. Task Timing Tracker

```typescript
// useTaskTimer.ts
import { useEffect, useState } from 'axios';
import axios from 'axios';

export const useTaskTimer = (taskName: string) => {
  const [startTime] = useState(Date.now());
  const [clickCount, setClickCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const trackClick = () => setClickCount(prev => prev + 1);
  const trackError = () => setErrorCount(prev => prev + 1);

  const complete = async (rating?: number) => {
    const completionTime = Date.now() - startTime;
    
    await axios.post('/api/metrics/usability', {
      action: taskName,
      completionTime,
      clickCount,
      errorCount,
      satisfactionScore: rating,
      metadata: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      }
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  };

  return { trackClick, trackError, complete };
};

// Usage:
const MyComponent = () => {
  const { trackClick, trackError, complete } = useTaskTimer('view-passport');

  const handleButtonClick = () => {
    trackClick();
    // ... your logic
  };

  const handleError = () => {
    trackError();
    // ... error handling
  };

  const handleComplete = () => {
    complete(5); // 5-star rating
  };

  return (/* ... */);
};
```

---

## Grading System

### Response Time
- **A+ (Excellent):** < 100ms
- **A (Very Good):** 100-300ms
- **B (Good):** 300-500ms
- **C (Fair):** 500-1000ms
- **D (Poor):** 1000-2000ms
- **F (Failing):** > 2000ms

### Accuracy
- **A+ (Excellent):** ≥ 99%
- **A (Very Good):** 95-99%
- **B (Good):** 90-95%
- **C (Fair):** 80-90%
- **D (Poor):** 70-80%
- **F (Failing):** < 70%

### Usability
- **A+ (Excellent):** ≥ 90/100
- **A (Very Good):** 80-90/100
- **B (Good):** 70-80/100
- **C (Fair):** 60-70/100
- **D (Poor):** 50-60/100
- **F (Failing):** < 50/100

### Overall Health
- **🟢 Excellent:** ≥ 80/100
- **🟡 Good:** 60-80/100
- **🟠 Fair:** 40-60/100
- **🔴 Needs Improvement:** < 40/100

---

## Testing Metrics

### 1. Generate Test Data

```bash
# Make some API requests to generate metrics
curl http://localhost:5000/api/patients -H "Authorization: Bearer <token>"
curl http://localhost:5000/api/medical-records -H "Authorization: Bearer <token>"
```

### 2. Track Test Usability

```bash
curl -X POST http://localhost:5000/api/metrics/usability \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-task",
    "completionTime": 2500,
    "clickCount": 5,
    "errorCount": 0,
    "satisfactionScore": 4
  }'
```

### 3. View Metrics

```bash
node check-system-metrics.js
```

---

## Data Retention

Metrics are automatically deleted after **90 days** to conserve database space.

To change retention period, edit `SystemMetrics.ts`:

```typescript
// Change 7776000 (90 days) to your preferred value
systemMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
```

---

## Best Practices

### 1. Track Key User Actions
```typescript
// Login
await metricsService.trackUsability({
  userId,
  userRole: 'patient',
  action: 'login',
  completionTime: Date.now() - loginStartTime,
  metadata: { method: 'national-id' }
});

// Passport View
await metricsService.trackUsability({
  userId,
  userRole: 'patient',
  action: 'view-passport',
  completionTime: Date.now() - viewStartTime,
  clickCount: 2
});
```

### 2. Track Critical Operations
```typescript
// Data sync
await metricsService.trackAccuracy({
  operation: 'openmrs-sync',
  isAccurate: syncSuccess,
  accuracyScore: syncSuccess ? 100 : 0,
  metadata: { recordCount: records.length }
});
```

### 3. Monitor Regularly
- Check metrics daily during development
- Set up alerts for production (low health score)
- Review usability feedback weekly
- Optimize slow endpoints monthly

---

## Troubleshooting

### No Metrics Data

**Cause:** Metrics haven't been tracked yet

**Solution:**
1. Make some API requests
2. Track some usability metrics
3. Wait a few minutes
4. Run `node check-system-metrics.js` again

### Low Accuracy Score

**Cause:** Data sync or validation issues

**Solution:**
1. Check accuracy tracking logs
2. Review `expectedResult` vs `actualResult`
3. Fix data sync logic
4. Re-test

### Slow Response Times

**Cause:** Inefficient queries or network issues

**Solution:**
1. Check endpoint performance: `GET /api/metrics/endpoints`
2. Identify slow endpoints
3. Optimize database queries
4. Add indexes
5. Implement caching

---

## Monitoring Dashboard (Future Enhancement)

Consider building a web dashboard to visualize:
- Real-time health score
- Response time graphs
- Accuracy trends
- User satisfaction charts
- Error logs
- Endpoint performance comparison

---

## Summary

✅ **Response Time** - Automatically tracked for all API requests  
✅ **Accuracy** - Track in your code with `metricsService.trackAccuracy()`  
✅ **Usability** - Track from frontend with `POST /api/metrics/usability`  
✅ **Errors** - Automatically tracked when errors occur  
✅ **Health Reports** - Run `node check-system-metrics.js`  
✅ **API Access** - GET `/api/metrics/health` (admin only)  

**Your system now has comprehensive metrics tracking! 🎉**
