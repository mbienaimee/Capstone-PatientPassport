#!/bin/bash

# Patient Passport OpenMRS Module Deployment Script
# This script helps deploy the module to an OpenMRS instance

set -e

echo "🚀 Patient Passport OpenMRS Module Deployment"
echo "============================================="

# Configuration
MODULE_FILE="omod/target/patientpassport-1.0.0.omod"
OPENMRS_URL=""
OPENMRS_USERNAME=""
OPENMRS_PASSWORD=""

# Check if module file exists
if [ ! -f "$MODULE_FILE" ]; then
    echo "❌ Module file not found: $MODULE_FILE"
    echo "   Please run build.sh first to create the module."
    exit 1
fi

echo "✅ Module file found: $MODULE_FILE"
echo ""

# Interactive configuration
read -p "Enter OpenMRS URL (e.g., http://localhost:8080/openmrs): " OPENMRS_URL
read -p "Enter OpenMRS username: " OPENMRS_USERNAME
read -s -p "Enter OpenMRS password: " OPENMRS_PASSWORD
echo ""

# Validate URL format
if [[ ! $OPENMRS_URL =~ ^https?:// ]]; then
    echo "❌ Invalid URL format. Please include http:// or https://"
    exit 1
fi

echo ""
echo "🔧 Configuration:"
echo "   URL: $OPENMRS_URL"
echo "   Username: $OPENMRS_USERNAME"
echo "   Module: $MODULE_FILE"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install curl first."
    exit 1
fi

# Test connection to OpenMRS
echo "🔍 Testing connection to OpenMRS..."
if curl -s -f "$OPENMRS_URL/login.htm" > /dev/null; then
    echo "✅ OpenMRS is accessible"
else
    echo "❌ Cannot connect to OpenMRS at $OPENMRS_URL"
    echo "   Please check the URL and ensure OpenMRS is running."
    exit 1
fi

echo ""
echo "📤 Uploading module to OpenMRS..."
echo "   This will upload the module file to your OpenMRS instance."
echo "   You will need to manually start the module in the OpenMRS admin interface."
echo ""

# Create a simple upload script
cat > upload_module.py << 'EOF'
#!/usr/bin/env python3
import requests
import sys
import os

def upload_module(openmrs_url, username, password, module_file):
    # Login to get session
    session = requests.Session()
    
    # Get login page
    login_url = f"{openmrs_url}/login.htm"
    response = session.get(login_url)
    
    if response.status_code != 200:
        print(f"❌ Failed to access login page: {response.status_code}")
        return False
    
    # Login
    login_data = {
        'username': username,
        'password': password
    }
    
    response = session.post(login_url, data=login_data)
    
    if 'login.htm' in response.url:
        print("❌ Login failed. Please check credentials.")
        return False
    
    print("✅ Successfully logged in to OpenMRS")
    
    # Upload module
    upload_url = f"{openmrs_url}/module/legacyui/admin/modules/uploadModule.form"
    
    with open(module_file, 'rb') as f:
        files = {'moduleFile': f}
        response = session.post(upload_url, files=files)
    
    if response.status_code == 200:
        print("✅ Module uploaded successfully!")
        print("")
        print("📋 Next steps:")
        print("   1. Go to Administration → Manage Modules")
        print("   2. Find 'Patient Passport Connector' in the list")
        print("   3. Click 'Start' to activate the module")
        print("   4. The module will appear on the home page and patient dashboard")
        return True
    else:
        print(f"❌ Upload failed: {response.status_code}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python3 upload_module.py <openmrs_url> <username> <password> <module_file>")
        sys.exit(1)
    
    success = upload_module(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
    sys.exit(0 if success else 1)
EOF

# Make the script executable
chmod +x upload_module.py

# Run the upload script
python3 upload_module.py "$OPENMRS_URL" "$OPENMRS_USERNAME" "$OPENMRS_PASSWORD" "$MODULE_FILE"

# Clean up
rm upload_module.py

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "📚 For more information, see the documentation in the docs/ folder."


