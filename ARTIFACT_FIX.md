# GitHub Actions Artifact Not Found - Fix

## Problem
Error: `Unable to download artifact(s): Artifact not found for name: node-app`

## Root Causes
1. **Permissions Issue**: Jobs need proper permissions to share artifacts
2. **Path Resolution**: Working directory might affect artifact paths
3. **Artifact Name**: Must match exactly between upload and download
4. **Artifact Not Created**: Upload might fail silently

## Fixes Applied

### 1. Added Required Permissions
```yaml
build:
  permissions:
    contents: read
    actions: write  # Required to upload artifacts

deploy:
  permissions:
    id-token: write
    contents: read
    actions: read  # Required to download artifacts
```

### 2. Fixed Path References
- Upload: `path: ./deploy-package` (relative to working directory)
- Download: `path: ./deploy-package` (consistent path)
- Added `if-no-files-found: error` to fail fast if package not created

### 3. Added Verification Steps
- Verify package exists before upload
- Verify artifact downloaded correctly
- Show package contents for debugging

### 4. Added GitHub Token
- Explicitly pass `GITHUB_TOKEN` to download step
- Ensures proper authentication for artifact access

## Verification Steps Added

### Before Upload:
```bash
if [ ! -d "deploy-package" ]; then
  echo "❌ Error: deploy-package directory not found!"
  exit 1
fi
```

### After Download:
```bash
if [ ! -d "deploy-package" ]; then
  echo "❌ Error: deploy-package not found after download!"
  exit 1
fi
```

## Expected Behavior

1. **Build Job**:
   - Creates `deploy-package` in `./backend/deploy-package`
   - Verifies package exists
   - Uploads artifact named `node-app`

2. **Deploy Job**:
   - Downloads artifact `node-app` from build job
   - Verifies download succeeded
   - Extracts to `./deploy-package`
   - Installs production dependencies
   - Deploys to Azure

## Troubleshooting

If artifact still not found:

1. **Check build job logs**:
   - Look for "Upload artifact" step
   - Verify "node-app" artifact was created
   - Check for any errors during upload

2. **Check deploy job logs**:
   - Look for "Download artifact" step
   - Verify artifact name matches exactly
   - Check permissions

3. **Verify artifact exists**:
   - Go to GitHub Actions run
   - Click on build job → Artifacts
   - Should see "node-app" listed

## File Changed
- `.github/workflows/main_patientpassport-api.yml`

