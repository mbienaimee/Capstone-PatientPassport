# Frontend Deployment Configuration
# This file contains all necessary configuration for deploying the Patient Passport frontend

# Environment Variables for Production
VITE_API_BASE_URL=https://capstone-patientpassport.onrender.com/api
VITE_SOCKET_URL=https://capstone-patientpassport.onrender.com
VITE_APP_NAME=Patient Passport
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG=false
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCKET_IO=true

# Build Configuration
NODE_VERSION=18
BUILD_COMMAND=npm run build
PUBLISH_DIRECTORY=dist

# Deployment Instructions:
# 1. Set these environment variables in your deployment platform
# 2. Run: npm install
# 3. Run: npm run build
# 4. Deploy the 'dist' folder contents

# For Netlify:
# - Build command: npm run build
# - Publish directory: dist
# - Environment variables: Set all VITE_* variables above

# For Vercel:
# - Build command: npm run build
# - Output directory: dist
# - Environment variables: Set all VITE_* variables above

# For Render:
# - Build command: npm run build
# - Static site directory: dist
# - Environment variables: Set all VITE_* variables above
