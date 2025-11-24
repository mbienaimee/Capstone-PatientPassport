# 🚀 Quick Start - Automatic OpenMRS Sync

## Start Backend with Auto-Sync

```bash
cd backend
npm run dev
```

## What You Should See

```
✅ Connected to MongoDB
✅ Connected to OpenMRS Hospital OpenMRS database
🔄 Auto-starting sync service with 30 second interval...
📍 Syncing: OpenMRS Hospital
   ✅ Found X observations to sync
```

## Verify It's Working

1. **Check console logs** - Look for "Syncing: OpenMRS Hospital" every 30 seconds
2. **Add new observation in OpenMRS** - It appears in Patient Passport within 30 seconds
3. **Test medication editing** - Should save without errors

## Configuration Summary

| Setting | Value | Location |
|---------|-------|----------|
| Auto-sync enabled | `true` | `.env` |
| Sync interval | 30 seconds | `.env` |
| Hospital | OpenMRS Hospital | `.env` |
| Database host | 102.130.118.47:3306 | `.env` |
| Hospital ID | 690ddb51f28baa37d530ea47 | `.env` |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No sync messages | Check `.env` has `HOSPITAL_1_ENABLED=true` |
| Connection failed | Verify OpenMRS MySQL is running |
| Observations not appearing | Check patient UUID matching |
| Medication save fails | Verify user is logged in as doctor |

## Key Features

✅ **Automatic:** No manual scripts needed  
✅ **Real-time:** Syncs every 30 seconds  
✅ **Multi-hospital:** Supports multiple OpenMRS instances  
✅ **Reliable:** Handles duplicates, errors gracefully  
✅ **Editable:** All synced observations can have medications added  

## Full Documentation

See: `AUTO_SYNC_SETUP_COMPLETE.md` for complete details.

---

**Status: PRODUCTION READY** ✅
