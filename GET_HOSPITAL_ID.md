# Get Hospital MongoDB ID

## Quick Steps:

### Option 1: MongoDB Compass

1. Open **MongoDB Compass**
2. Connect to: `mongodb+srv://reine:KgzYIrHtPXg4Xfc3@cluster0.fslpg5p.mongodb.net/CapstonePassportSystem`
3. Select database: `CapstonePassportSystem`
4. Open collection: `hospitals`
5. Find your hospital document
6. Copy the `_id` value (looks like: `673b1a2b3c4d5e6f7a8b9c0d`)

### Option 2: MongoDB Atlas

1. Go to MongoDB Atlas website
2. Browse Collections
3. Database: `CapstonePassportSystem`
4. Collection: `hospitals`
5. Find your hospital
6. Copy the `_id` value

### Option 3: MongoDB Shell

```javascript
use CapstonePassportSystem
db.hospitals.find({}, { _id: 1, name: 1, address: 1 }).pretty()
```

## What You'll See:

```json
{
  "_id": ObjectId("673b1a2b3c4d5e6f7a8b9c0d"),
  "name": "Central Hospital",
  "address": "Kigali, Rwanda"
}
```

## Copy This Value:

The `_id` without `ObjectId()` wrapper:
```
673b1a2b3c4d5e6f7a8b9c0d
```

## Then Update backend/.env:

Replace this line:
```bash
HOSPITAL_1_ID=PASTE_YOUR_HOSPITAL_MONGODB_ID_HERE
```

With:
```bash
HOSPITAL_1_ID=673b1a2b3c4d5e6f7a8b9c0d
```

And change:
```bash
HOSPITAL_1_ENABLED=false
```

To:
```bash
HOSPITAL_1_ENABLED=true
```

## Then Restart Backend:

```powershell
cd backend
npm run dev
```

You should see:
```
✅ Connected to Local OpenMRS Hospital OpenMRS database
✅ Initialized 1 database connections
🔄 Auto-starting sync service with 5 minute interval...
OpenMRS Sync: ENABLED ✅
```

## That's it! Your sync will be working! 🚀
