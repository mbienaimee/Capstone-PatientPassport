#!/bin/bash

# OpenMRS Patient Passport Module - Installation Script
# This script automates the installation and configuration of the Patient Passport module

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
MODULE_NAME="patientpassport"
MODULE_VERSION="1.0.0"
API_BASE_URL="https://patientpassport-api.azurewebsites.net/api"
FRONTEND_URL="https://patient-passpo.netlify.app/"
OTP_ENABLED="true"
AUDIT_LOGGING="true"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Java version
check_java() {
    if ! command_exists java; then
        print_error "Java is not installed. Please install Java 11 or higher."
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 11 ]; then
        print_error "Java version $JAVA_VERSION is not supported. Please install Java 11 or higher."
        exit 1
    fi
    
    print_success "Java version check passed"
}

# Function to check Maven
check_maven() {
    if ! command_exists mvn; then
        print_error "Maven is not installed. Please install Maven 3.6 or higher."
        exit 1
    fi
    
    print_success "Maven check passed"
}

# Function to check OpenMRS SDK
check_openmrs_sdk() {
    if ! command_exists mvn || ! mvn openmrs-sdk:help >/dev/null 2>&1; then
        print_warning "OpenMRS SDK not found. Installing..."
        mvn org.openmrs.maven.plugins:openmrs-sdk-maven-plugin:setup-sdk
    fi
    
    print_success "OpenMRS SDK check passed"
}

# Function to get OpenMRS instance path
get_openmrs_path() {
    if [ -z "$OPENMRS_PATH" ]; then
        read -p "Enter the path to your OpenMRS instance directory: " OPENMRS_PATH
    fi
    
    if [ ! -d "$OPENMRS_PATH" ]; then
        print_error "OpenMRS directory does not exist: $OPENMRS_PATH"
        exit 1
    fi
    
    print_success "Using OpenMRS path: $OPENMRS_PATH"
}

# Function to build the module
build_module() {
    print_status "Building Patient Passport module..."
    
    if [ ! -f "pom.xml" ]; then
        print_error "pom.xml not found. Please run this script from the module root directory."
        exit 1
    fi
    
    mvn clean package -DskipTests
    
    if [ ! -f "omod/target/${MODULE_NAME}-${MODULE_VERSION}.omod" ]; then
        print_error "Module build failed. OMOD file not found."
        exit 1
    fi
    
    print_success "Module built successfully"
}

# Function to install module using SDK
install_module_sdk() {
    print_status "Installing module using OpenMRS SDK..."
    
    cd "$OPENMRS_PATH"
    mvn openmrs-sdk:install-module -DartifactId="$MODULE_NAME" -Dversion="$MODULE_VERSION"
    
    print_success "Module installed successfully"
}

# Function to install module manually
install_module_manual() {
    print_status "Installing module manually..."
    
    MODULE_DIR="$OPENMRS_PATH/modules"
    if [ ! -d "$MODULE_DIR" ]; then
        mkdir -p "$MODULE_DIR"
    fi
    
    cp "omod/target/${MODULE_NAME}-${MODULE_VERSION}.omod" "$MODULE_DIR/"
    
    print_success "Module file copied to modules directory"
}

# Function to configure global properties
configure_properties() {
    print_status "Configuring global properties..."
    
    # This would typically be done through OpenMRS admin interface or database
    # For now, we'll create a configuration script
    cat > configure_properties.sql << EOF
-- Patient Passport Module Configuration
INSERT INTO global_property (property, property_value, description) VALUES
('patientpassport.api.baseUrl', '$API_BASE_URL', 'Base URL for Patient Passport API'),
('patientpassport.frontend.url', '$FRONTEND_URL', 'Frontend URL for Patient Passport'),
('patientpassport.api.timeout', '30000', 'API timeout in milliseconds'),
('patientpassport.enable.otp', '$OTP_ENABLED', 'Enable OTP verification for passport access'),
('patientpassport.audit.logging', '$AUDIT_LOGGING', 'Enable audit logging for passport access'),
('patientpassport.sync.interval', '3600', 'Sync interval in seconds'),
('patientpassport.max.retry.attempts', '3', 'Maximum retry attempts for API calls'),
('patientpassport.emergency.access.duration', '3600', 'Emergency access duration in seconds')
ON DUPLICATE KEY UPDATE property_value = VALUES(property_value);
EOF
    
    print_success "Configuration SQL script created: configure_properties.sql"
    print_warning "Please run this SQL script against your OpenMRS database"
}

# Function to create user roles
create_roles() {
    print_status "Creating user roles and privileges..."
    
    cat > create_roles.sql << EOF
-- Create privileges
INSERT INTO privilege (privilege, description) VALUES
('Patient Passport: View Patient Passport', 'View patient passport data'),
('Patient Passport: Update Patient Passport', 'Update patient passport data'),
('Patient Passport: Access Emergency Override', 'Access patient passport in emergency situations')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Create roles
INSERT INTO role (role, description) VALUES
('Patient Passport User', 'Basic user with passport viewing rights'),
('Patient Passport Manager', 'User with passport management rights'),
('Patient Passport Emergency', 'Emergency access role')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Assign privileges to roles
INSERT INTO role_privilege (role, privilege) VALUES
('Patient Passport User', 'Patient Passport: View Patient Passport'),
('Patient Passport Manager', 'Patient Passport: View Patient Passport'),
('Patient Passport Manager', 'Patient Passport: Update Patient Passport'),
('Patient Passport Emergency', 'Patient Passport: View Patient Passport'),
('Patient Passport Emergency', 'Patient Passport: Access Emergency Override')
ON DUPLICATE KEY UPDATE role = VALUES(role);
EOF
    
    print_success "Role creation SQL script created: create_roles.sql"
    print_warning "Please run this SQL script against your OpenMRS database"
}

# Function to test installation
test_installation() {
    print_status "Testing installation..."
    
    # Check if module file exists
    if [ -f "$OPENMRS_PATH/modules/${MODULE_NAME}-${MODULE_VERSION}.omod" ]; then
        print_success "Module file found in modules directory"
    else
        print_error "Module file not found in modules directory"
        return 1
    fi
    
    # Check if OpenMRS is running (optional)
    if command_exists curl; then
        if curl -s "http://localhost:8080/openmrs" >/dev/null 2>&1; then
            print_success "OpenMRS appears to be running"
        else
            print_warning "OpenMRS does not appear to be running on localhost:8080"
        fi
    fi
    
    print_success "Installation test completed"
}

# Function to display post-installation instructions
post_install_instructions() {
    print_status "Post-installation instructions:"
    echo ""
    echo "1. Start/Restart your OpenMRS instance"
    echo "2. Run the SQL scripts created:"
    echo "   - configure_properties.sql (for global properties)"
    echo "   - create_roles.sql (for user roles)"
    echo "3. Assign Patient Passport roles to appropriate users"
    echo "4. Test the module by accessing:"
    echo "   http://your-openmrs-instance/openmrs/module/patientpassport/manage.htm"
    echo ""
    echo "5. Configure additional settings as needed:"
    echo "   - API endpoints"
    echo "   - OTP settings"
    echo "   - Audit logging preferences"
    echo ""
    echo "For detailed configuration, see DEPLOYMENT_GUIDE.md"
}

# Function to create uninstall script
create_uninstall_script() {
    cat > uninstall.sh << 'EOF'
#!/bin/bash

# Uninstall Patient Passport Module
echo "Uninstalling Patient Passport Module..."

# Remove module file
rm -f /path/to/openmrs/modules/patientpassport-1.0.0.omod

# Remove global properties (optional)
echo "To remove global properties, run the following SQL:"
echo "DELETE FROM global_property WHERE property LIKE 'patientpassport.%';"

# Remove roles (optional)
echo "To remove roles and privileges, run the following SQL:"
echo "DELETE FROM role_privilege WHERE role LIKE 'Patient Passport%';"
echo "DELETE FROM role WHERE role LIKE 'Patient Passport%';"
echo "DELETE FROM privilege WHERE privilege LIKE 'Patient Passport%';"

echo "Uninstall completed. Please restart OpenMRS."
EOF
    
    chmod +x uninstall.sh
    print_success "Uninstall script created: uninstall.sh"
}

# Main installation function
main() {
    echo "=========================================="
    echo "OpenMRS Patient Passport Module Installer"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    check_java
    check_maven
    check_openmrs_sdk
    
    # Get OpenMRS path
    get_openmrs_path
    
    # Build module
    build_module
    
    # Choose installation method
    echo ""
    echo "Choose installation method:"
    echo "1. Using OpenMRS SDK (recommended)"
    echo "2. Manual installation"
    read -p "Enter your choice (1 or 2): " INSTALL_METHOD
    
    case $INSTALL_METHOD in
        1)
            install_module_sdk
            ;;
        2)
            install_module_manual
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    # Configure properties and roles
    configure_properties
    create_roles
    
    # Test installation
    test_installation
    
    # Create uninstall script
    create_uninstall_script
    
    # Display instructions
    post_install_instructions
    
    print_success "Installation completed successfully!"
}

# Run main function
main "$@"
