#!/bin/bash

# Patient Passport OpenMRS Module - Quick Deploy Script
# This script helps deploy the Patient Passport module to OpenMRS

echo "🚀 Patient Passport OpenMRS Module Deployment Script"
echo "=================================================="

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "pom.xml" ]; then
    echo "❌ Please run this script from the patientpassport module directory"
    echo "   Expected location: openmrs-modules/patientpassport/"
    exit 1
fi

echo "✅ Building the module..."
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Module built successfully!"
    echo ""
    echo "📦 Generated files:"
    echo "   - omod/target/patientpassport-1.0.0.omod"
    echo "   - omod/target/patientpassport-1.0.0.zip"
    echo ""
    echo "🚀 Deployment Options:"
    echo ""
    echo "1. Using OpenMRS SDK (Recommended):"
    echo "   mvn openmrs-sdk:install -DartifactId=patientpassport -Dversion=1.0.0"
    echo ""
    echo "2. Manual Installation:"
    echo "   Copy omod/target/patientpassport-1.0.0.omod to your OpenMRS modules directory"
    echo "   Then restart OpenMRS"
    echo ""
    echo "3. Admin Interface:"
    echo "   Upload omod/target/patientpassport-1.0.0.omod via OpenMRS admin interface"
    echo ""
    echo "📋 After deployment:"
    echo "   - Configure URLs in Administration → Patient Passport Settings"
    echo "   - Access via homepage link or patient dashboard"
    echo "   - Check DEPLOYMENT_GUIDE.md for detailed instructions"
    echo ""
    echo "🎉 Ready for deployment!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi