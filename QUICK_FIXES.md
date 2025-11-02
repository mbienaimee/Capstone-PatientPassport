# Quick Fixes Applied

## ✅ Fixed Issues

### 1. Azure Deployment 409 Conflict Error

**Problem**: `Conflict (CODE: 409)` when deploying to Azure App Service

**Solution Applied**:
- Added a wait step that checks for ongoing deployments before starting a new one
- Removed the stop/start cycle that could cause conflicts
- Added `restart: true` and `clean: true` to the deployment step
- Removed `slot-name: 'Production'` (not needed for default slot)

**File Changed**: `.github/workflows/main_patientpassport-api.yml`

### 2. Git DNS Resolution Error

**Problem**: `Could not resolve host: github.com`

**Solutions Applied**:
1. Configured Git to use HTTP/1.1
2. Increased Git buffer size
3. Flushed DNS cache

**Additional Solutions** (if still having issues):
- Use SSH instead of HTTPS (see `GIT_DNS_FIX.md`)
- Configure system DNS to use Google DNS (8.8.8.8)
- Check for proxy settings

**Files Created**: 
- `GIT_DNS_FIX.md` - Comprehensive guide for DNS issues
- `QUICK_FIXES.md` - This file

## 🚀 Next Steps

1. **Test Git Push**:
   ```bash
   git push origin main
   ```

2. **If Git Push Still Fails**, try:
   ```bash
   # Switch to SSH
   git remote set-url origin git@github.com:mbienaimee/Capstone-PatientPassport.git
   ```

3. **Monitor Azure Deployment**:
   - Check GitHub Actions workflow
   - Wait for deployment to complete before triggering another

## 📝 Notes

- The Azure workflow now waits for any ongoing deployments to complete
- Git has been configured with optimized settings for Windows
- DNS cache has been flushed

