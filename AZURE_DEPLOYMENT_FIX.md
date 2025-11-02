# Azure Deployment Fix - Permission Denied Error

## Problem
Error: `Access to the path 'C:\local\Temp\zipdeploy\extracted' is denied.`
- Deployment package is 200.08 MB (too large)
- Includes `node_modules` causing permission issues
- Azure can't extract files due to locked temp directories

## Root Causes
1. **Package Size**: Uploading entire backend folder including `node_modules` (~200MB)
2. **File Locks**: Previous failed deployments leaving locked files
3. **Permissions**: Azure can't clean temp directories from failed deployments
4. **Missing Cleanup**: No cleanup step between deployments

## Fixes Applied

### 1. Optimized Deployment Package
**File**: `.github/workflows/main_patientpassport-api.yml`

**Changes**:
- Create `deploy-package` folder with only essential files
- Exclude `node_modules`, `src/`, and other development files
- Include only: `dist/`, `package.json`, `package-lock.json`, `scripts/`
- Install production dependencies during deployment step

**Before**: 200MB package with everything
**After**: ~10-20MB package with only compiled code

### 2. Added Pre-Deployment Cleanup
- Stop app service before deployment (releases file locks)
- Clean previous deployment artifacts
- Wait periods to ensure cleanup completes

### 3. Production Dependencies Installation
- Install `npm ci --only=production` during deployment
- Reduces package size significantly
- Ensures only production dependencies are included

### 4. Better Error Handling
- Added proper wait times
- Check deployment status before proceeding
- Clean start/stop sequence

## Deployment Package Structure
```
deploy-package/
├── dist/              # Compiled TypeScript
├── package.json       # Dependencies
├── package-lock.json  # Lock file
├── scripts/           # Startup scripts
└── node_modules/      # Installed during deployment (production only)
```

## Benefits
1. ✅ **Smaller package size**: 200MB → ~20MB
2. ✅ **Faster deployments**: Less data to transfer
3. ✅ **No permission errors**: Clean temp directories
4. ✅ **Production ready**: Only production dependencies
5. ✅ **Reliable deployments**: Proper cleanup between deployments

## File Changed
- `.github/workflows/main_patientpassport-api.yml`

## Testing
After these changes:
- Deployment package should be much smaller
- No permission denied errors
- Faster deployment times
- Cleaner deployment process

