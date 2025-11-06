# 🚀 Quick Setup - OpenMRS Auto-Sync

## ⚡ 1-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Add Hospital Configuration to `.env`

```bash
# Enable auto-sync
OPENMRS_AUTO_START_SYNC=true
OPENMRS_SYNC_INTERVAL=5

# Hospital 1 Configuration
HOSPITAL_1_ID=your_hospital_mongodb_id
HOSPITAL_1_NAME=Central Hospital
HOSPITAL_1_DB_HOST=localhost
HOSPITAL_1_DB_PORT=3306
HOSPITAL_1_DB_NAME=openmrs
HOSPITAL_1_DB_USER=openmrs_readonly
HOSPITAL_1_DB_PASSWORD=your_password
HOSPITAL_1_ENABLED=true
```

### Step 3: Create Read-Only MySQL User

```sql
-- On each OpenMRS MySQL server
mysql -u root -p

CREATE USER 'openmrs_readonly'@'%' IDENTIFIED BY 'your_password';
GRANT SELECT ON openmrs.* TO 'openmrs_readonly'@'%';
FLUSH PRIVILEGES;
```

### Step 4: Start Server
```bash
npm run dev
```

### Step 5: Verify

Look for this in logs:
```
✅ Connected to Central Hospital OpenMRS database
🔄 Auto-starting sync service with 5 minute interval...
OpenMRS Sync: ENABLED
```

## ✅ Test It

1. **Create observation in OpenMRS** (any hospital)
   - Open patient record
   - Add diagnosis/medication
   - Save

2. **Wait 5 minutes** (or call manual sync API)

3. **Check Patient Passport**
   - Login as patient
   - View medical records
   - See observation from OpenMRS automatically

## 🎯 What Happens Automatically

```
Doctor saves in OpenMRS
        ↓
5 minutes later...
        ↓
Sync service retrieves observation
        ↓
Matches patient by National ID
        ↓
Creates doctor/hospital if needed
        ↓
Stores in Patient Passport
        ↓
Patient sees it immediately
```

## 📞 Need Help?

See full guide: `OPENMRS_AUTO_SYNC_GUIDE.md`

### Common Issues

**Can't connect to database?**
- Check firewall settings
- Verify MySQL user credentials
- Test with: `mysql -h HOST -u USER -p`

**Patients not syncing?**
- Ensure National ID matches in both systems
- Check patient exists in Patient Passport first

**No observations appearing?**
- Check sync logs in terminal
- Verify observations exist in OpenMRS: `SELECT COUNT(*) FROM obs`
- Call manual sync: `POST /api/openmrs-sync/sync-all`

## 🎉 Done!

Your system now automatically syncs observations from all OpenMRS hospitals to Patient Passport!

**No manual entry required. Ever.**
