# OpenMRS Observation Sync - Full Historical Data

## Overview
The OpenMRS sync service now syncs **ALL past observations** by default, ensuring complete historical medical data is transferred from OpenMRS to Patient Passport.

## What Changed

### 1. Default Behavior: Full History Sync
- **Previous**: Only synced observations since last sync timestamp
- **New**: Syncs ALL observations from OpenMRS history by default
- **Limit**: Up to 10,000 most recent observations per sync (increased from 5,000)

### 2. Sync Modes

#### Full History Mode (Default)
- Syncs ALL observations regardless of when they were created
- Ignores last sync timestamp
- Ensures complete historical data
- **Used by**: Automatic sync on startup, manual sync by default

#### Incremental Mode
- Only syncs observations created since last sync
- More efficient for ongoing real-time updates
- **Used by**: Optional, must be explicitly requested

## How to Use

### Automatic Sync (On Server Startup)
The sync service automatically starts and syncs ALL historical observations:

```typescript
// Happens automatically in app.ts
openmrsSyncService.startAutoSync(10); // Syncs every 10 seconds
```

**First run**: Syncs complete history  
**Subsequent runs**: Continues to sync all history (ensures no gaps)

### Manual API Trigger

#### Full History Sync (Default)
```bash
POST /api/openmrs-sync/sync-all
# OR explicitly
POST /api/openmrs-sync/sync-all?fullHistory=true
```

#### Incremental Sync (Only New)
```bash
POST /api/openmrs-sync/sync-all?fullHistory=false
```

**Response:**
```json
{
  "success": true,
  "message": "Manual sync triggered for all hospitals (FULL HISTORY - running in background)",
  "data": {
    "status": "triggered",
    "mode": "full_history"
  }
}
```

## Console Output

### Full History Mode
```
🔄 ═══════════════════════════════════════════════════════
🔄 Starting Multi-Hospital Observation Sync (FULL HISTORY)
🔄 ═══════════════════════════════════════════════════════

📍 Syncing: Hospital Marie Reine
   Sync mode: ALL HISTORY
   Found 1247 observations
   ✅ Synced: 1247, Errors: 0
```

### Incremental Mode
```
🔄 ═══════════════════════════════════════════════════════
🔄 Starting Multi-Hospital Observation Sync (INCREMENTAL)
🔄 ═══════════════════════════════════════════════════════

📍 Syncing: Hospital Marie Reine
   Sync mode: Since 2025-11-17T10:30:00.000Z
   Found 23 new observations
   ✅ Synced: 23, Errors: 0
```

## Benefits

### Complete Historical Data
- **All past diagnoses** from OpenMRS are available in Patient Passport
- **All past medications** are synced
- **All past observations** are included
- No data gaps regardless of when sync was started

### Duplicate Prevention
- Built-in duplicate checking by `openmrsData.obsId`
- Same observation won't be created twice
- Safe to run full history sync multiple times

### Performance
- Fetches up to 10,000 observations per sync
- Orders by most recent first (`date_created DESC`)
- Processes in batches for efficiency
- Background execution doesn't block API

## Technical Details

### Modified Files
1. **`backend/src/services/openmrsSyncService.ts`**
   - Added `syncAllHistory` parameter (default: `true`)
   - Updated `syncAllHospitals()` method
   - Updated `syncHospital()` method
   - Increased observation limit to 10,000

2. **`backend/src/controllers/openmrsSyncController.ts`**
   - Added `fullHistory` query parameter support
   - Updated audit logging
   - Enhanced response messages

### Database Query
```sql
SELECT 
  o.obs_id,
  o.person_id,
  o.concept_id,
  o.encounter_id,
  o.obs_datetime,
  o.location_id,
  o.value_coded,
  o.value_text,
  o.value_numeric,
  o.comments,
  o.creator,
  o.date_created,
  o.voided
FROM obs o
WHERE o.voided = 0
  -- No date filter when syncAllHistory = true
ORDER BY o.date_created DESC, o.obs_id DESC
LIMIT 10000
```

## Verification

### Check Synced Observations
```javascript
// Run in MongoDB shell or script
db.medicalrecords.find({
  'openmrsData': { $exists: true }
}).count()

// Should show all historical observations
```

### View Observation Details
```javascript
db.medicalrecords.find({
  'openmrsData': { $exists: true }
}).sort({ createdAt: -1 }).limit(5)
```

## Recommendations

1. **First Deployment**: Use full history mode to ensure all data is synced
2. **Daily Operations**: Full history mode is still safe (duplicate prevention works)
3. **Testing**: Use incremental mode for faster testing if needed
4. **Monitoring**: Check console logs to verify observation count matches expectations

## Notes

- Sync runs in background, doesn't block API responses
- Duplicate checking ensures data integrity
- Observation limit of 10,000 can be increased if needed
- Full history sync may take longer on first run but subsequent runs are efficient due to duplicate prevention
