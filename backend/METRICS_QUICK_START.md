# System Metrics - Quick Reference 📊

## What Can You Check?

### 1. **Response Time** ⏱️
- How fast your API responds
- Average, min, max response times
- Per-endpoint performance
- **Grading:** A+ (<100ms) to F (>2000ms)

### 2. **Accuracy** ✅
- Data validation correctness
- Sync operation success rate
- Overall accuracy percentage
- **Grading:** A+ (≥99%) to F (<70%)

### 3. **Usability Score** 👤
- User satisfaction ratings
- Task completion times
- Click counts and error rates
- **Grading:** A+ (≥90/100) to F (<50/100)

### 4. **Overall Health** 🏥
- Combined system health score
- Status: Excellent, Good, Fair, or Poor
- **Grading:** 🟢 (≥80) to 🔴 (<40)

---

## Quick Commands

```bash
# Check system health (last 24 hours)
node check-system-metrics.js

# Check last hour
node check-system-metrics.js hour

# Check last week
node check-system-metrics.js week

# Generate test data
node test-metrics.js

# Then check results
node check-system-metrics.js
```

---

## API Endpoints (Admin Only)

```bash
# Get health report
GET /api/metrics/health?period=day

# Get dashboard
GET /api/metrics/dashboard

# Get response times
GET /api/metrics/response-time

# Get accuracy
GET /api/metrics/accuracy

# Get usability
GET /api/metrics/usability

# Get endpoint performance
GET /api/metrics/endpoints
```

**Note:** Requires admin authentication token

---

## Track Usability (Any User)

```bash
POST /api/metrics/usability
Authorization: Bearer <your-token>

{
  "action": "view-passport",
  "completionTime": 2500,
  "clickCount": 3,
  "errorCount": 0,
  "satisfactionScore": 5
}
```

---

## Automatic Tracking

### ✅ Already Tracking:
- **Response Time:** Every API request
- **Errors:** All system errors

### ⚙️ Needs Implementation:
- **Accuracy:** Add `metricsService.trackAccuracy()` in your code
- **Usability:** Add tracking from frontend

---

## Example Output

```
==============================================================
  SYSTEM METRICS REPORT - Last DAY
==============================================================

📊 RESPONSE TIME METRICS
Average Response Time: 145.23 ms
Performance Grade:     A (Very Good)
Total Requests:        1,247

✅ ACCURACY METRICS
Accuracy Rate:         99.26%
Accuracy Grade:        A+ (Excellent)

👤 USABILITY METRICS
Avg Satisfaction:      4.2/5.00
Usability Score:       78.5/100
Usability Grade:       B (Good)

🏥 OVERALL SYSTEM HEALTH
OVERALL HEALTH SCORE:  88.4/100
Status:                🟢 EXCELLENT
==============================================================
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/models/SystemMetrics.ts` | Database model for metrics |
| `src/services/metricsService.ts` | Metrics tracking service |
| `src/controllers/metricsController.ts` | API controllers |
| `src/routes/metrics.ts` | API routes |
| `src/middleware/metricsMiddleware.ts` | Auto-tracking middleware |
| `check-system-metrics.js` | CLI tool to view metrics |
| `test-metrics.js` | Generate sample data |
| `METRICS_GUIDE.md` | Complete documentation |

---

## Quick Test

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Generate test data:**
   ```bash
   node test-metrics.js
   ```

3. **Check metrics:**
   ```bash
   node check-system-metrics.js
   ```

4. **You should see:**
   - Response time metrics ✅
   - Accuracy metrics ✅
   - Usability metrics ✅
   - Overall health score ✅

---

## Next Steps

1. ✅ Test the metrics system
2. 📝 Read `METRICS_GUIDE.md` for detailed docs
3. 🎨 Add usability tracking to frontend
4. 📊 Monitor regularly during development
5. 🚀 Set up alerts for production

---

## Need Help?

- **Complete Guide:** `METRICS_GUIDE.md`
- **Test Script:** `node test-metrics.js`
- **Check Health:** `node check-system-metrics.js`
- **API Docs:** http://localhost:5000/api-docs

**Your system now has comprehensive metrics monitoring! 🎉**
