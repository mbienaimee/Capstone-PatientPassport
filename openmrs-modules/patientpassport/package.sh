#!/bin/bash

# Patient Passport OpenMRS Module Packaging Script
# This script creates a distribution package for easy deployment

set -e

echo "📦 Creating Patient Passport OpenMRS Module Package"
echo "=================================================="

# Configuration
PACKAGE_NAME="patientpassport-openmrs-module"
VERSION="1.0.0"
DIST_DIR="dist"
PACKAGE_DIR="$DIST_DIR/$PACKAGE_NAME-$VERSION"

# Clean and create directories
echo "🧹 Cleaning previous packages..."
rm -rf "$DIST_DIR"
mkdir -p "$PACKAGE_DIR"

# Build the module first
echo "🔨 Building module..."
./build.sh

# Check if build was successful
if [ ! -f "omod/target/patientpassport-1.0.0.omod" ]; then
    echo "❌ Build failed. Module file not found."
    exit 1
fi

echo "✅ Module built successfully"
echo ""

# Copy files to package directory
echo "📁 Creating package structure..."

# Copy module file
cp omod/target/patientpassport-1.0.0.omod "$PACKAGE_DIR/"

# Copy documentation
mkdir -p "$PACKAGE_DIR/docs"
cp -r docs/* "$PACKAGE_DIR/docs/" 2>/dev/null || true

# Copy scripts
mkdir -p "$PACKAGE_DIR/scripts"
cp build.sh "$PACKAGE_DIR/scripts/"
cp build.bat "$PACKAGE_DIR/scripts/"
cp deploy.sh "$PACKAGE_DIR/scripts/"

# Create package README
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# Patient Passport OpenMRS Module

This package contains the Patient Passport integration module for OpenMRS.

## Contents

- `patientpassport-1.0.0.omod` - The OpenMRS module file
- `docs/` - Documentation and setup guides
- `scripts/` - Build and deployment scripts

## Quick Start

1. **Upload Module to OpenMRS:**
   - Log in to your OpenMRS instance as an administrator
   - Go to Administration → Manage Modules
   - Click "Add or Upgrade Module"
   - Upload the `patientpassport-1.0.0.omod` file
   - Click "Start Module"

2. **Access Patient Passport:**
   - The "Patient Passport" link will appear on the home page
   - Patient-specific access is available from the patient dashboard
   - Admin settings are available in Administration → Patient Passport Settings

## Configuration

After installation, configure the module by:

1. Going to Administration → Patient Passport Settings
2. Setting the correct frontend URL (default: https://jade-pothos-e432d0.netlify.app)
3. Setting the backend API URL (default: https://capstone-patientpassport.onrender.com/api)
4. Enabling/disabling patient context passing as needed

## Support

For support and documentation, visit the project repository or contact the development team.

## Version

Module Version: 1.0.0
Compatible with OpenMRS: 2.5.0+
EOF

# Create installation guide
cat > "$PACKAGE_DIR/INSTALLATION.md" << 'EOF'
# Installation Guide

## Prerequisites

- OpenMRS 2.5.0 or higher
- Java 8 or 11
- Administrator access to OpenMRS

## Installation Steps

### 1. Download and Extract

Download the module package and extract it to a temporary directory.

### 2. Upload Module

1. Log in to your OpenMRS instance as an administrator
2. Navigate to **Administration** → **Manage Modules**
3. Click **"Add or Upgrade Module"**
4. Click **"Choose File"** and select `patientpassport-1.0.0.omod`
5. Click **"Upload"**

### 3. Start Module

1. Find **"Patient Passport Connector"** in the module list
2. Click **"Start"** to activate the module
3. Wait for the module to start (status should show as "Started")

### 4. Configure Module

1. Go to **Administration** → **Patient Passport Settings**
2. Verify the frontend URL is correct
3. Verify the backend API URL is correct
4. Adjust iframe height if needed
5. Enable/disable patient context as required

### 5. Test Installation

1. Go to the OpenMRS home page
2. Look for the **"Patient Passport"** link
3. Click it to verify the integration works
4. Test patient-specific access from a patient dashboard

## Troubleshooting

### Module Won't Start

- Check OpenMRS logs for errors
- Ensure Java version is compatible (8 or 11)
- Verify module file is not corrupted

### Frontend Not Loading

- Check if the frontend URL is accessible
- Verify network connectivity
- Check browser console for errors

### Patient Context Not Working

- Ensure patient context is enabled in settings
- Check that patient UUIDs are being passed correctly
- Verify the frontend can handle patient parameters

## Support

For additional support, check the documentation or contact the development team.
EOF

# Create a simple test script
cat > "$PACKAGE_DIR/test-connection.sh" << 'EOF'
#!/bin/bash

# Test connection to Patient Passport services

echo "🔍 Testing Patient Passport Connections"
echo "======================================"

# Test frontend
echo "Testing frontend connection..."
if curl -s -f "https://jade-pothos-e432d0.netlify.app" > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

# Test backend
echo "Testing backend connection..."
if curl -s -f "https://capstone-patientpassport.onrender.com/api/health" > /dev/null; then
    echo "✅ Backend is accessible"
else
    echo "❌ Backend is not accessible"
fi

echo ""
echo "Test completed!"
EOF

chmod +x "$PACKAGE_DIR/test-connection.sh"

# Create ZIP package
echo "📦 Creating ZIP package..."
cd "$DIST_DIR"
zip -r "$PACKAGE_NAME-$VERSION.zip" "$PACKAGE_NAME-$VERSION"
cd ..

echo ""
echo "✅ Package created successfully!"
echo ""
echo "📦 Package contents:"
echo "   - $PACKAGE_DIR/"
echo "   - $DIST_DIR/$PACKAGE_NAME-$VERSION.zip"
echo ""
echo "📋 Package includes:"
echo "   - OpenMRS module file (.omod)"
echo "   - Installation documentation"
echo "   - Configuration guides"
echo "   - Test scripts"
echo "   - Build scripts"
echo ""
echo "🚀 Ready for distribution!"


