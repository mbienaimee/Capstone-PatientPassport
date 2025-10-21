# 🚨 Azure Environment Variables Troubleshooting Guide

## 🔍 **Current Issue**
- Error: `JWT_REFRESH_SECRET is not defined`
- You've updated Azure environment settings
- Error still persists
- Backend is running but missing environment variables

## 🔧 **Troubleshooting Steps**

### **Step 1: Verify Environment Variables in Azure Portal**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: App Services → `patientpassport-api`
3. **Go to**: Settings → Environment variables
4. **Verify these variables exist**:

```bash
JWT_REFRESH_SECRET=refresh-secret-key-12345-67890
JWT_REFRESH_EXPIRE=30d
JWT_RESET_SECRET=reset-secret-key-67890-12345
JWT_RESET_EXPIRE=10m
```

### **Step 2: Check Variable Names and Values**

**Common Issues:**
- ❌ Variable name has extra spaces
- ❌ Value is empty or has quotes
- ❌ Variable name is case-sensitive
- ❌ Variables weren't saved properly

**Correct Format:**
```
Name: JWT_REFRESH_SECRET
Value: refresh-secret-key-12345-67890
```

### **Step 3: Force Restart Azure App Service**

1. **Go to**: Overview tab
2. **Click**: "Restart" button
3. **Wait**: 3-5 minutes for complete restart
4. **Check**: Logs to see if restart completed

### **Step 4: Check Azure Logs**

1. **Go to**: Monitoring → Log stream
2. **Look for**: Any startup errors
3. **Check**: If environment variables are loaded

## 🚀 **Alternative Solution: Redeploy Backend**

If environment variables still don't work, redeploy the backend:

### **Option A: Git Deploy**
```bash
cd backend
git add .
git commit -m "Fix environment variables"
git push azure main
```

### **Option B: Azure CLI Deploy**
```bash
cd backend
az webapp up --name patientpassport-api --resource-group <your-resource-group>
```

## 🔧 **Quick Fix: Update Backend Code**

If Azure environment variables continue to fail, we can modify the backend code to use fallback values:

### **Modify authController.ts**
```typescript
// Change this:
const secret = process.env['JWT_REFRESH_SECRET'];
if (!secret) {
  throw new Error('JWT_REFRESH_SECRET is not defined');
}

// To this:
const secret = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret-12345';
```

## 📋 **Verification Checklist**

- [ ] Environment variables added in Azure Portal
- [ ] Variable names are exact (case-sensitive)
- [ ] Values are not empty
- [ ] Variables saved successfully
- [ ] Azure App Service restarted
- [ ] Waited 3-5 minutes after restart
- [ ] Checked Azure logs for errors

## 🎯 **Next Steps**

1. **Double-check** environment variables in Azure Portal
2. **Restart** Azure App Service again
3. **Wait** 5 minutes for complete restart
4. **Test** hospital login again
5. **If still failing**, use the code modification approach

## 📞 **Emergency Fix**

If nothing else works, I can help you modify the backend code to use fallback values, which will immediately fix the login issue.
