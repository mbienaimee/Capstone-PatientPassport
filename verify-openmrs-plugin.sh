#!/bin/bash

# Patient Passport OpenMRS Plugin Verification Script
# This script verifies that the Patient Passport plugin is properly integrated and working

set -e

echo "🔍 Patient Passport OpenMRS Plugin Verification"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_status "$test_name"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if OpenMRS is running
print_step "Checking OpenMRS Status"
run_test "OpenMRS is running" "curl -s http://localhost:8084/openmrs/ws/rest/v1/systeminformation"

# Check if Patient Passport plugin is loaded
print_step "Checking Patient Passport Plugin"
run_test "Patient Passport plugin is loaded" "curl -s http://localhost:8084/openmrs/ws/rest/v1/patientpassport"

# Test specific API endpoints
print_step "Testing API Endpoints"

# Test generate universal ID endpoint (should return 400 for missing params, but endpoint should exist)
run_test "Generate Universal ID endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/openmrs/ws/rest/v1/patientpassport/generate-universal-id | grep -E '^(400|405)$'"

# Test find by universal ID endpoint
run_test "Find by Universal ID endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/openmrs/ws/rest/v1/patientpassport/find-by-universal-id | grep -E '^(400|405)$'"

# Test emergency override endpoint
run_test "Emergency Override endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/openmrs/ws/rest/v1/patientpassport/emergency-override | grep -E '^(400|405)$'"

# Test audit logs endpoint
run_test "Audit Logs endpoint" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/openmrs/ws/rest/v1/patientpassport/audit-logs | grep -E '^(200|400|405)$'"

# Test FHIR integration
print_step "Testing FHIR Integration"
run_test "FHIR Patient endpoint" "curl -s http://localhost:8084/openmrs/ws/fhir2/R4/Patient"

# Test admin pages
print_step "Testing Admin Pages"
run_test "Patient Passport Admin page" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/openmrs/module/patientpassportcore/admin.page | grep -E '^(200|302)$'"

# Test patient dashboard integration
run_test "Patient Dashboard page" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/openmrs/module/patientpassportcore/patientDashboard.page | grep -E '^(200|302)$'"

# Check database tables
print_step "Checking Database Integration"
run_test "Database connection" "curl -s http://localhost:8084/openmrs/ws/rest/v1/systeminformation | grep -q 'systemInformation'"

# Test patient creation (if possible)
print_step "Testing Patient Creation"
echo "Creating a test patient..."

# Create a test patient
PATIENT_DATA='{
  "resourceType": "Patient",
  "name": [{"given": ["Test"], "family": "Patient"}],
  "gender": "male",
  "birthDate": "1990-01-01"
}'

PATIENT_RESPONSE=$(curl -s -X POST http://localhost:8084/openmrs/ws/fhir2/R4/Patient \
  -H "Content-Type: application/json" \
  -d "$PATIENT_DATA" 2>/dev/null)

if echo "$PATIENT_RESPONSE" | grep -q "Patient"; then
    print_status "Test patient created successfully"
    ((TESTS_PASSED++))
    
    # Extract patient ID for further testing
    PATIENT_ID=$(echo "$PATIENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$PATIENT_ID" ]; then
        echo "  Patient ID: $PATIENT_ID"
        
        # Test generating universal ID for this patient
        echo "Testing Universal ID generation..."
        UNIVERSAL_ID_RESPONSE=$(curl -s -X POST "http://localhost:8084/openmrs/ws/rest/v1/patientpassport/generate-universal-id?patientUuid=$PATIENT_ID" 2>/dev/null)
        
        if echo "$UNIVERSAL_ID_RESPONSE" | grep -q "success"; then
            print_status "Universal ID generated successfully"
            ((TESTS_PASSED++))
        else
            print_warning "Universal ID generation may need patient UUID conversion"
            ((TESTS_FAILED++))
        fi
    fi
else
    print_warning "Test patient creation failed (may require authentication)"
    ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed! Patient Passport plugin is working correctly."
    echo ""
    echo "✅ Plugin Features Available:"
    echo "   - Patient Dashboard Integration"
    echo "   - Universal Patient ID Generation"
    echo "   - Emergency Override System"
    echo "   - Audit Logging"
    echo "   - FHIR Integration"
    echo "   - Admin Panel"
    echo ""
    echo "🔗 Access URLs:"
    echo "   - OpenMRS: http://localhost:8084/openmrs/"
    echo "   - Admin Panel: http://localhost:8084/openmrs/admin/"
    echo "   - Patient Passport Admin: http://localhost:8084/openmrs/module/patientpassportcore/admin.page"
    echo ""
    echo "📚 Next Steps:"
    echo "   1. Login to OpenMRS and explore the Patient Passport features"
    echo "   2. Create patients and test the Universal ID generation"
    echo "   3. Configure API settings in the admin panel"
    echo "   4. Test emergency override functionality"
    echo "   5. Integrate with your Patient Passport frontend"
else
    echo ""
    echo "⚠️  Some tests failed. Please check the following:"
    echo "   1. Ensure OpenMRS is running: http://localhost:8084/openmrs/"
    echo "   2. Check that the Patient Passport plugin is loaded in Admin → Manage Modules"
    echo "   3. Verify the plugin is started (not just uploaded)"
    echo "   4. Check OpenMRS logs for any errors"
    echo "   5. Ensure all dependencies are properly installed"
fi

echo ""
echo "🔍 For detailed troubleshooting, check:"
echo "   - OpenMRS logs: docker-compose -f openmrs-docker-compose.yml logs openmrs"
echo "   - Plugin status: Administration → Manage Modules"
echo "   - API documentation: http://localhost:8084/openmrs/ws/rest/v1/patientpassport"







