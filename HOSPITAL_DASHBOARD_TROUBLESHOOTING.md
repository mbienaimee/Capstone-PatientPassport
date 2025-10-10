# Hospital Dashboard Error Troubleshooting Guide

## 🚨 Common Error Scenarios

### 1. **"User not authenticated" Error**
**Symptoms:**
- Dashboard shows "User not authenticated" error
- User exists in database but dashboard fails to load

**Possible Causes:**
- JWT token expired or invalid
- Token not stored in localStorage
- Backend authentication middleware issue
- User role mismatch

**Solutions:**
```bash
# Check browser console for detailed error messages
# Clear browser storage and re-login
localStorage.clear();
# Or manually clear specific items:
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('hospitalAuth');
```

### 2. **"Hospital data not found" Error**
**Symptoms:**
- User is authenticated but hospital information is missing
- Dashboard shows "Hospital Information Not Found"

**Possible Causes:**
- Hospital record not linked to user account
- Hospital status is 'inactive' or 'pending'
- Database relationship issue between User and Hospital models

**Solutions:**
1. **Check Database Relationships:**
```javascript
// Verify hospital exists and is linked to user
const hospital = await Hospital.findOne({ user: userId });
console.log('Hospital found:', hospital);
```

2. **Check Hospital Status:**
```javascript
// Ensure hospital status is 'active'
const hospital = await Hospital.findOne({ 
  user: userId, 
  status: 'active' 
});
```

### 3. **API Endpoint Errors**
**Symptoms:**
- 401 Unauthorized errors
- 404 Not Found errors
- 500 Internal Server errors

**Debug Steps:**
1. **Use Debug Component:**
   - Navigate to `/hospital-dashboard-debug`
   - Test API endpoints directly
   - Check authentication status

2. **Check Network Tab:**
   - Open browser DevTools
   - Go to Network tab
   - Look for failed requests to `/api/dashboard/hospital`

## 🔧 Debugging Steps

### Step 1: Check Authentication Status
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
console.log('Hospital Auth:', localStorage.getItem('hospitalAuth'));
```

### Step 2: Test API Endpoints
```javascript
// Test getCurrentUser endpoint
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(response => response.json())
.then(data => console.log('Current User:', data));

// Test hospital dashboard endpoint
fetch('/api/dashboard/hospital', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(response => response.json())
.then(data => console.log('Hospital Dashboard:', data));
```

### Step 3: Check Backend Logs
```bash
# Check backend server logs for errors
cd backend
npm run dev
# Look for authentication or database errors
```

### Step 4: Verify Database State
```javascript
// Check if hospital exists in database
db.hospitals.findOne({ user: ObjectId("USER_ID_HERE") });

// Check if user exists and has correct role
db.users.findOne({ _id: ObjectId("USER_ID_HERE") });
```

## 🛠️ Quick Fixes

### Fix 1: Clear Storage and Re-login
```javascript
// Clear all authentication data
localStorage.clear();
// Navigate to login page
window.location.href = '/hospital-login';
```

### Fix 2: Check User Role
```javascript
// Verify user role is 'hospital'
const user = JSON.parse(localStorage.getItem('user'));
if (user.role !== 'hospital') {
  console.error('User role is not hospital:', user.role);
  // Clear storage and redirect to login
  localStorage.clear();
  window.location.href = '/hospital-login';
}
```

### Fix 3: Verify Hospital Record
```javascript
// Check if hospital record exists for user
// This should be done in backend dashboard controller
const hospital = await Hospital.findOne({ user: req.user._id });
if (!hospital) {
  throw new CustomError('Hospital record not found for user', 404);
}
```

## 🔍 Advanced Debugging

### Enable Debug Mode
```javascript
// Add to browser console for detailed logging
localStorage.setItem('debug', 'true');
// Reload page to see detailed logs
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Look for failed requests (red status codes)
5. Check request headers and response body

### Database Verification
```bash
# Connect to MongoDB
mongo
use patient_passport_db

# Check users collection
db.users.find({ role: "hospital" }).pretty();

# Check hospitals collection
db.hospitals.find().pretty();

# Check if hospital is linked to user
db.hospitals.find({ user: ObjectId("USER_ID") }).pretty();
```

## 📋 Common Solutions

### Solution 1: Re-register Hospital
If hospital record is missing:
1. Go to `/hospital-register`
2. Register the hospital again
3. Ensure status is set to 'active'

### Solution 2: Update Hospital Status
```javascript
// In MongoDB shell
db.hospitals.updateOne(
  { user: ObjectId("USER_ID") },
  { $set: { status: "active" } }
);
```

### Solution 3: Fix User-Hospital Relationship
```javascript
// Ensure hospital is properly linked to user
db.hospitals.updateOne(
  { _id: ObjectId("HOSPITAL_ID") },
  { $set: { user: ObjectId("USER_ID") } }
);
```

## 🚀 Prevention

### Best Practices:
1. **Always check authentication status** before making API calls
2. **Handle errors gracefully** with user-friendly messages
3. **Implement retry mechanisms** for failed requests
4. **Log detailed error information** for debugging
5. **Validate data relationships** in backend controllers

### Error Handling Pattern:
```javascript
try {
  const response = await apiService.request('/dashboard/hospital');
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
    throw new Error(response.message);
  }
} catch (error) {
  if (error.message.includes('401')) {
    // Handle authentication error
    logout();
    navigate('/hospital-login');
  } else {
    // Handle other errors
    showError(error.message);
  }
}
```

## 📞 Support

If the issue persists after trying these solutions:

1. **Check the debug component**: `/hospital-dashboard-debug`
2. **Review browser console** for detailed error messages
3. **Check backend logs** for server-side errors
4. **Verify database state** using MongoDB queries
5. **Test API endpoints** directly using browser DevTools

## 🔄 Testing Checklist

- [ ] User can login successfully
- [ ] Token is stored in localStorage
- [ ] User role is 'hospital'
- [ ] Hospital record exists in database
- [ ] Hospital status is 'active'
- [ ] Hospital is linked to user account
- [ ] API endpoint `/api/dashboard/hospital` returns data
- [ ] Frontend displays hospital information correctly

---

**Last Updated**: December 2024  
**Version**: 1.0.0

