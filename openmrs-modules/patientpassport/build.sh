#!/bin/bash

# Patient Passport OpenMRS Module Build Script
# This script builds the OpenMRS module for deployment

set -e

echo "🏥 Building Patient Passport OpenMRS Module..."
echo "=============================================="

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven first."
    echo "   Download from: https://maven.apache.org/download.cgi"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 8 or 11 first."
    echo "   Download from: https://adoptium.net/"
    exit 1
fi

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 8 ] || [ "$JAVA_VERSION" -gt 11 ]; then
    echo "⚠️  Warning: Java version $JAVA_VERSION detected. OpenMRS works best with Java 8 or 11."
fi

echo "✅ Prerequisites check passed"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
mvn clean

# Compile and package
echo "🔨 Compiling and packaging module..."
mvn compile package

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Generated files:"
    echo "   - omod/target/patientpassport-1.0.0.omod"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Upload the .omod file to your OpenMRS instance"
    echo "   2. Go to Administration → Manage Modules"
    echo "   3. Click 'Add or Upgrade Module'"
    echo "   4. Upload the patientpassport-1.0.0.omod file"
    echo "   5. Click 'Start Module'"
    echo ""
    echo "📋 Module will be available at:"
    echo "   - Home page: Patient Passport link"
    echo "   - Patient dashboard: Patient Passport fragment"
    echo "   - Admin page: Patient Passport Settings"
    echo ""
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi


