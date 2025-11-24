# Setting Up OpenMRS Direct Database Sync

## Why Direct DB Sync is Failing

Direct database sync requires a **local MySQL database with OpenMRS installed**. Currently:

- ❌ No MySQL server running on localhost:3306
- ❌ No OpenMRS database available
- ✅ REST API sync is working as fallback

## Should You Use Direct DB Sync?

### When to Use Direct DB Sync:
- OpenMRS database is on the same network
- Need real-time sync (every 10 seconds)
- Want to reduce load on OpenMRS REST API

### When to Use REST API Sync (Current Setup):
- ✅ OpenMRS is on a remote server
- ✅ Don't have database credentials
- ✅ Easier to set up and maintain
- ✅ More secure (no direct DB access)

**Recommendation:** Stick with REST API sync - it's already working!

---

## Option 1: Keep Using REST API Sync (Recommended)

**Current status:** ✅ Working

**No changes needed.** Your system syncs patient data via OpenMRS REST API, which is the standard approach.

**Disable the warning:**

Update `.env`:
\`\`\`env
# Set to empty to disable direct DB sync attempts
OPENMRS_DB_HOST=
OPENMRS_DB_PORT=
\`\`\`

---

## Option 2: Install OpenMRS with MySQL (Advanced)

If you really need direct database access:

### Step 1: Install MySQL

**Download MySQL:**
- Go to: https://dev.mysql.com/downloads/installer/
- Download MySQL Installer for Windows
- Install MySQL Server 8.0+

**During installation:**
- Set root password: `OpenMRSPass123!` (or update .env)
- Keep port: `3306`
- Enable MySQL as Windows Service

### Step 2: Install OpenMRS

**Download OpenMRS:**
- Go to: https://openmrs.org/download/
- Download OpenMRS Standalone
- Run the installer

**Configure OpenMRS:**
- Database: MySQL
- Host: `localhost`
- Port: `3306`
- Database name: `openmrs`
- Username: `openmrs_user`
- Password: `OpenMRSPass123!`

### Step 3: Create Database User

Open MySQL Command Line:
\`\`\`sql
-- Create user
CREATE USER 'openmrs_user'@'localhost' IDENTIFIED BY 'OpenMRSPass123!';

-- Grant permissions
GRANT ALL PRIVILEGES ON openmrs.* TO 'openmrs_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

### Step 4: Verify Connection

Test from PowerShell:
\`\`\`powershell
# Install MySQL client if needed
# Then test connection:
mysql -h localhost -P 3306 -u openmrs_user -p
# Enter password: OpenMRSPass123!

# Inside MySQL:
SHOW DATABASES;
USE openmrs;
SHOW TABLES;
\`\`\`

### Step 5: Restart Backend

\`\`\`powershell
cd backend
npm run dev
\`\`\`

**Expected output:**
\`\`\`
🚀 Starting direct database OpenMRS observation sync service
   Sync interval: 10 seconds
   Database: localhost:3306/openmrs
   Starting from observation ID: 12345 (syncing last 24 hours)
\`\`\`

---

## Option 3: Connect to Remote OpenMRS Database

If OpenMRS is on a remote server (hospital network):

### Update .env:
\`\`\`env
# Replace with actual hospital OpenMRS database
OPENMRS_DB_HOST=192.168.1.100  # Hospital OpenMRS server IP
OPENMRS_DB_PORT=3306
OPENMRS_DB_USER=openmrs_user
OPENMRS_DB_PASSWORD=actual_password_here
OPENMRS_DB_NAME=openmrs

# Sync interval (seconds)
OPENMRS_SYNC_INTERVAL_SECONDS=10
\`\`\`

### Security Considerations:
- ⚠️ Database server must allow remote connections
- ⚠️ Firewall must allow port 3306
- ⚠️ Use VPN for secure connection
- ⚠️ Never expose database publicly

---

## Troubleshooting Direct DB Sync

### Error: "Failed to start direct DB sync service"

**Check 1: MySQL is running**
\`\`\`powershell
# Test if MySQL port is open
Test-NetConnection -ComputerName localhost -Port 3306
\`\`\`

**Check 2: Database exists**
\`\`\`powershell
mysql -h localhost -u openmrs_user -p -e "SHOW DATABASES;"
\`\`\`

**Check 3: Credentials are correct**
\`\`\`powershell
mysql -h localhost -u openmrs_user -p openmrs -e "SELECT COUNT(*) FROM obs;"
\`\`\`

### Error: "Access denied for user"

Update credentials in `.env`:
\`\`\`env
OPENMRS_DB_USER=root  # or correct username
OPENMRS_DB_PASSWORD=your_actual_password
\`\`\`

### Error: "Can't connect to MySQL server"

1. **Start MySQL service:**
   \`\`\`powershell
   # In PowerShell (as Administrator)
   Start-Service MySQL80  # or MySQL version you installed
   \`\`\`

2. **Check if port 3306 is listening:**
   \`\`\`powershell
   netstat -ano | findstr :3306
   \`\`\`

---

## Current System Status

### ✅ What's Working:
- REST API sync (primary method)
- Patient data synchronization
- OpenMRS integration via HTTP

### ❌ What's Not Working:
- Direct database sync (optional feature)
- Requires local MySQL + OpenMRS installation

### 💡 Recommendation:

**Keep using REST API sync** - it's:
- ✅ Already configured and working
- ✅ More secure (no direct DB access)
- ✅ Easier to maintain
- ✅ Standard approach for OpenMRS integration

**Only set up direct DB sync if:**
- You have OpenMRS database on same network
- You need real-time sync (<10 seconds)
- You have database administrator access

---

## Quick Fix: Disable Direct DB Sync Warning

If you don't need direct DB sync, stop the error messages:

### Update backend/src/app.ts:

Find this section (around line 94):
\`\`\`typescript
// Start scheduled observation sync service (direct DB sync)
console.log('🔄 Starting Direct Database Observation Sync Service');
directDBSyncService.start();
\`\`\`

**Comment it out:**
\`\`\`typescript
// Direct DB sync disabled - using REST API sync only
// console.log('🔄 Starting Direct Database Observation Sync Service');
// directDBSyncService.start();
console.log('ℹ️  Direct DB sync disabled - using REST API sync');
\`\`\`

**Or use environment variable:**

Add to `.env`:
\`\`\`env
ENABLE_DIRECT_DB_SYNC=false
\`\`\`

Then update `app.ts`:
\`\`\`typescript
if (process.env.ENABLE_DIRECT_DB_SYNC === 'true') {
  console.log('🔄 Starting Direct Database Observation Sync Service');
  directDBSyncService.start();
} else {
  console.log('ℹ️  Direct DB sync disabled - using REST API sync');
}
\`\`\`

---

## Summary

**Problem:** Direct DB sync fails because there's no local MySQL database with OpenMRS.

**Solution:** Use REST API sync (already working) ✅

**Next Steps:**
1. ✅ Keep using REST API sync (no action needed)
2. 🔧 Disable direct DB sync warning (optional)
3. 📚 Only install MySQL/OpenMRS if specifically needed

**Your system is working correctly with REST API sync!**
