#!/bin/bash

# Patient Passport OpenMRS Plugin Deployment Script
# This script ensures the Patient Passport plugin is properly integrated into OpenMRS

set -e

echo "🏥 Patient Passport OpenMRS Plugin Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if OpenMRS is running
print_step "Checking if OpenMRS is running..."
if curl -s http://localhost:8084/openmrs/ws/rest/v1/systeminformation > /dev/null 2>&1; then
    print_status "OpenMRS is running at http://localhost:8084/openmrs/"
else
    print_error "OpenMRS is not running. Please start it first:"
    echo "  docker-compose -f openmrs-docker-compose.yml up -d"
    exit 1
fi

# Check if Maven is available
print_step "Checking for Maven..."
if command -v mvn &> /dev/null; then
    print_status "Maven found: $(mvn -version | head -n 1)"
else
    print_warning "Maven not found. Installing via Chocolatey..."
    choco install maven -y
fi

# Build the Patient Passport plugin
print_step "Building Patient Passport plugin..."
cd openmrs-modules/patient-passport-core/omod

if [ ! -f "pom.xml" ]; then
    print_error "pom.xml not found. Please ensure you're in the correct directory."
    exit 1
fi

print_status "Cleaning previous build..."
mvn clean

print_status "Compiling plugin..."
mvn compile

print_status "Building OMOD file..."
mvn package

# Check if build was successful
OMOD_FILE="target/patientpassportcore-1.0.0.omod"
if [ ! -f "$OMOD_FILE" ]; then
    print_error "Plugin build failed. OMOD file not found."
    exit 1
fi

print_status "Plugin built successfully: $OMOD_FILE"

# Deploy to OpenMRS
print_step "Deploying plugin to OpenMRS..."

# Method 1: Copy to Docker volume
if docker ps | grep -q "openmrs"; then
    print_status "Copying plugin to OpenMRS modules directory..."
    docker cp "$OMOD_FILE" $(docker ps --filter "name=openmrs" --format "{{.ID}}"):/usr/local/tomcat/.OpenMRS/modules/
    
    print_status "Restarting OpenMRS to load the plugin..."
    docker-compose -f ../../openmrs-docker-compose.yml restart openmrs
    
    print_status "Waiting for OpenMRS to restart..."
    sleep 30
else
    print_warning "OpenMRS container not found. Please copy the plugin manually:"
    echo "  Copy: $OMOD_FILE"
    echo "  To: OpenMRS modules directory"
    echo "  Then restart OpenMRS"
fi

# Test the plugin
print_step "Testing plugin integration..."

# Wait for OpenMRS to be ready
print_status "Waiting for OpenMRS to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8084/openmrs/ws/rest/v1/systeminformation > /dev/null 2>&1; then
        print_status "OpenMRS is ready!"
        break
    fi
    echo -n "."
    sleep 2
done

# Test plugin endpoints
print_status "Testing Patient Passport API endpoints..."

# Test if the plugin is loaded
if curl -s http://localhost:8084/openmrs/ws/rest/v1/patientpassport > /dev/null 2>&1; then
    print_status "✅ Patient Passport plugin is active!"
else
    print_warning "⚠️  Patient Passport plugin may not be fully loaded yet."
    print_warning "   Please check OpenMRS Admin → Manage Modules"
fi

# Display success information
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Plugin Information:"
echo "- Name: Patient Passport Core"
echo "- Version: 1.0.0"
echo "- File: $OMOD_FILE"
echo ""
echo "Access URLs:"
echo "- OpenMRS: http://localhost:8084/openmrs/"
echo "- Admin Panel: http://localhost:8084/openmrs/admin/"
echo "- Patient Passport Admin: http://localhost:8084/openmrs/module/patientpassportcore/admin.page"
echo ""
echo "API Endpoints:"
echo "- REST API: http://localhost:8084/openmrs/ws/rest/v1/patientpassport"
echo "- FHIR API: http://localhost:8084/openmrs/ws/fhir2/R4/Patient"
echo ""
echo "Next Steps:"
echo "1. Login to OpenMRS: http://localhost:8084/openmrs/"
echo "2. Go to Administration → Manage Modules"
echo "3. Verify 'Patient Passport Core' is started"
echo "4. Test by creating a patient and checking the Patient Passport section"
echo "5. Configure API settings in the Patient Passport admin panel"
echo ""
print_status "Patient Passport plugin deployment completed successfully!"

# Return to original directory
cd ../../..








