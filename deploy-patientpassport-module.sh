#!/bin/bash

# Patient Passport OpenMRS Module Deployment Script
# This script builds and deploys the Patient Passport module to OpenMRS

set -e

echo "🏥 Patient Passport OpenMRS Module Deployment"
echo "=============================================="

# Configuration
OPENMRS_MODULE_DIR="/usr/local/tomcat/.OpenMRS/modules"
MODULE_NAME="patientpassportcore"
MODULE_VERSION="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    print_error "Maven is not installed. Please install Maven first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 8+ first."
    exit 1
fi

print_status "Building Patient Passport Core Module..."

# Navigate to module directory
cd openmrs-modules/patient-passport-core/omod

# Clean and build the module
print_status "Cleaning previous build..."
mvn clean

print_status "Compiling module..."
mvn compile

print_status "Building OMOD file..."
mvn package

# Check if build was successful
if [ ! -f "target/${MODULE_NAME}-${MODULE_VERSION}.omod" ]; then
    print_error "Module build failed. OMOD file not found."
    exit 1
fi

print_status "Module built successfully!"

# Check if OpenMRS modules directory exists
if [ ! -d "$OPENMRS_MODULE_DIR" ]; then
    print_warning "OpenMRS modules directory not found at $OPENMRS_MODULE_DIR"
    print_warning "Please ensure OpenMRS is installed and running."
    print_warning "You can manually copy the OMOD file to your OpenMRS modules directory."
    echo ""
    print_status "OMOD file location: $(pwd)/target/${MODULE_NAME}-${MODULE_VERSION}.omod"
    exit 0
fi

# Stop OpenMRS if running
print_status "Stopping OpenMRS..."
sudo systemctl stop tomcat 2>/dev/null || print_warning "Could not stop Tomcat service"

# Copy module to OpenMRS modules directory
print_status "Copying module to OpenMRS modules directory..."
sudo cp "target/${MODULE_NAME}-${MODULE_VERSION}.omod" "$OPENMRS_MODULE_DIR/"

# Set proper permissions
sudo chown tomcat:tomcat "$OPENMRS_MODULE_DIR/${MODULE_NAME}-${MODULE_VERSION}.omod"
sudo chmod 644 "$OPENMRS_MODULE_DIR/${MODULE_NAME}-${MODULE_VERSION}.omod"

# Start OpenMRS
print_status "Starting OpenMRS..."
sudo systemctl start tomcat

print_status "Waiting for OpenMRS to start..."
sleep 30

# Check if OpenMRS is running
if curl -s http://localhost:8080/openmrs > /dev/null; then
    print_status "✅ OpenMRS is running successfully!"
else
    print_warning "OpenMRS may still be starting up. Please check the logs."
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Module Information:"
echo "- Name: $MODULE_NAME"
echo "- Version: $MODULE_VERSION"
echo "- Location: $OPENMRS_MODULE_DIR/${MODULE_NAME}-${MODULE_VERSION}.omod"
echo ""
echo "Next Steps:"
echo "1. Log into OpenMRS: http://localhost:8080/openmrs"
echo "2. Go to Administration > Manage Modules"
echo "3. Find 'Patient Passport Core' and start it"
echo "4. Configure the module settings"
echo "5. Test the integration with your Patient Passport system"
echo ""
echo "API Endpoints:"
echo "- REST API: http://localhost:8080/openmrs/ws/rest/v1/patientpassport"
echo "- FHIR API: http://localhost:8080/openmrs/ws/fhir2/R4/Patient"
echo ""
echo "Admin Pages:"
echo "- Administration: http://localhost:8080/openmrs/module/patientpassportcore/admin.page"
echo ""
print_status "Deployment script completed successfully!"












