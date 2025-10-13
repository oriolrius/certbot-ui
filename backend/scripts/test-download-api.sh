#!/bin/bash

# Certificate Download API Testing Script
# This script tests the download endpoints with real certificates

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:5000/api}"
TOKEN="${API_TOKEN:-}"
OUTPUT_DIR="/tmp/cert-api-test"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Certificate Download API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
command -v curl >/dev/null 2>&1 || {
    echo -e "${RED}✗ curl is not installed${NC}"
    exit 1
}
echo -e "${GREEN}✓ curl found${NC}"

command -v jq >/dev/null 2>&1 || {
    echo -e "${YELLOW}⚠ jq is not installed - JSON output will be raw${NC}"
    JQ_AVAILABLE=false
}
echo -e "${GREEN}✓ jq found${NC}"
JQ_AVAILABLE=true

# Setup
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Get token if not provided
if [ -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}Authentication required${NC}"
    read -p "Username: " USERNAME
    read -sp "Password: " PASSWORD
    echo

    echo -e "${YELLOW}Logging in...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

    if [ "$JQ_AVAILABLE" = true ]; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
        if [ "$TOKEN" = "null" ]; then
            echo -e "${RED}✗ Login failed${NC}"
            echo "$LOGIN_RESPONSE" | jq '.'
            exit 1
        fi
    else
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi

    echo -e "${GREEN}✓ Logged in successfully${NC}"
fi

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_api_test() {
    local test_name="$1"
    local cert_name="$2"
    local format="$3"
    local component="$4"
    local password="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "\n${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    echo -e "  Certificate: $cert_name"
    echo -e "  Format: $format, Component: $component"

    local url="$API_BASE_URL/certificates/$cert_name/download?format=$format&component=$component"
    if [ -n "$password" ]; then
        url="$url&password=$password"
    fi

    local filename="$cert_name-$component.$format"
    local http_code=$(curl -s -w "%{http_code}" -o "$filename" \
        -H "Authorization: Bearer $TOKEN" \
        "$url")

    if [ "$http_code" = "200" ]; then
        if [ -f "$filename" ] && [ -s "$filename" ]; then
            echo -e "${GREEN}✓ PASSED (HTTP $http_code, file size: $(stat -f%z "$filename" 2>/dev/null || stat -c%s "$filename") bytes)${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            echo -e "${RED}✗ FAILED (empty file)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
        cat "$filename" 2>/dev/null || true
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Get list of certificates
echo -e "\n${YELLOW}Fetching certificate list...${NC}"
CERT_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/certificates")

if [ "$JQ_AVAILABLE" = true ]; then
    CERT_COUNT=$(echo "$CERT_LIST" | jq -r '.data | length')
    echo -e "${GREEN}✓ Found $CERT_COUNT certificate(s)${NC}"

    if [ "$CERT_COUNT" = "0" ]; then
        echo -e "${YELLOW}⚠ No certificates found. Please obtain a certificate first.${NC}"
        exit 0
    fi

    # Get first certificate name for testing
    FIRST_CERT=$(echo "$CERT_LIST" | jq -r '.data[0].name')
    echo -e "${GREEN}✓ Using certificate: $FIRST_CERT${NC}"
else
    echo -e "${YELLOW}⚠ Cannot parse certificates without jq. Using default: example.com${NC}"
    FIRST_CERT="example.com"
fi

# Test PEM formats
echo -e "\n${BLUE}=== Testing PEM Format ===${NC}"
run_api_test "PEM fullchain" "$FIRST_CERT" "pem" "fullchain"
run_api_test "PEM cert only" "$FIRST_CERT" "pem" "cert"
run_api_test "PEM chain" "$FIRST_CERT" "pem" "chain"
run_api_test "PEM privkey" "$FIRST_CERT" "pem" "privkey"
run_api_test "PEM bundle" "$FIRST_CERT" "pem" "bundle"

# Test DER formats
echo -e "\n${BLUE}=== Testing DER Format ===${NC}"
run_api_test "DER fullchain" "$FIRST_CERT" "der" "fullchain"
run_api_test "DER cert only" "$FIRST_CERT" "der" "cert"
run_api_test "DER chain" "$FIRST_CERT" "der" "chain"
run_api_test "DER privkey" "$FIRST_CERT" "der" "privkey"

# Test P7B formats
echo -e "\n${BLUE}=== Testing P7B Format ===${NC}"
run_api_test "P7B fullchain" "$FIRST_CERT" "p7b" "fullchain"
run_api_test "P7B cert only" "$FIRST_CERT" "p7b" "cert"
run_api_test "P7B chain" "$FIRST_CERT" "p7b" "chain"

# Test PKCS12 formats
echo -e "\n${BLUE}=== Testing PKCS12 Format ===${NC}"
run_api_test "PKCS12 fullchain" "$FIRST_CERT" "pkcs12" "fullchain" "testpassword123"
run_api_test "PKCS12 cert only" "$FIRST_CERT" "pkcs12" "cert" "testpassword123"
run_api_test "PKCS12 bundle" "$FIRST_CERT" "pkcs12" "bundle" "testpassword123"

# Test JKS formats (if keytool is available)
if command -v keytool >/dev/null 2>&1; then
    echo -e "\n${BLUE}=== Testing JKS Format ===${NC}"
    run_api_test "JKS fullchain" "$FIRST_CERT" "jks" "fullchain" "testpassword123"
    run_api_test "JKS cert only" "$FIRST_CERT" "jks" "cert" "testpassword123"
    run_api_test "JKS bundle" "$FIRST_CERT" "jks" "bundle" "testpassword123"
else
    echo -e "\n${YELLOW}⚠ Skipping JKS tests - keytool not available${NC}"
fi

# Test CRT formats
echo -e "\n${BLUE}=== Testing CRT Format ===${NC}"
run_api_test "CRT fullchain" "$FIRST_CERT" "crt" "fullchain"
run_api_test "CRT cert only" "$FIRST_CERT" "crt" "cert"

# Test CER formats
echo -e "\n${BLUE}=== Testing CER Format ===${NC}"
run_api_test "CER fullchain" "$FIRST_CERT" "cer" "fullchain"
run_api_test "CER cert only" "$FIRST_CERT" "cer" "cert"

# Test Root CA downloads
echo -e "\n${BLUE}=== Testing Root CA Downloads ===${NC}"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "\n${BLUE}Test $TOTAL_TESTS: Download ISRG Root X1${NC}"
http_code=$(curl -s -w "%{http_code}" -o "isrg-root-x1.pem" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_BASE_URL/certificates/root/x1")
if [ "$http_code" = "200" ] && [ -f "isrg-root-x1.pem" ] && [ -s "isrg-root-x1.pem" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "\n${BLUE}Test $TOTAL_TESTS: Download ISRG Root X2${NC}"
http_code=$(curl -s -w "%{http_code}" -o "isrg-root-x2.pem" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_BASE_URL/certificates/root/x2")
if [ "$http_code" = "200" ] && [ -f "isrg-root-x2.pem" ] && [ -s "isrg-root-x2.pem" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Validation tests (if openssl is available)
if command -v openssl >/dev/null 2>&1; then
    echo -e "\n${BLUE}=== Validating Downloaded Files ===${NC}"

    VALIDATION_TESTS=0
    VALIDATION_PASSED=0

    # Validate PEM files
    if [ -f "$FIRST_CERT-fullchain.pem" ]; then
        VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
        if openssl x509 -in "$FIRST_CERT-fullchain.pem" -noout -text >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PEM fullchain is valid${NC}"
            VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
        else
            echo -e "${RED}✗ PEM fullchain is invalid${NC}"
        fi
    fi

    # Validate DER files
    if [ -f "$FIRST_CERT-fullchain.der" ]; then
        VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
        if openssl x509 -in "$FIRST_CERT-fullchain.der" -inform DER -noout -text >/dev/null 2>&1; then
            echo -e "${GREEN}✓ DER fullchain is valid${NC}"
            VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
        else
            echo -e "${RED}✗ DER fullchain is invalid${NC}"
        fi
    fi

    # Validate PKCS12 files
    if [ -f "$FIRST_CERT-fullchain.pkcs12" ]; then
        VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
        if openssl pkcs12 -in "$FIRST_CERT-fullchain.pkcs12" -noout -password pass:testpassword123 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PKCS12 fullchain is valid${NC}"
            VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
        else
            echo -e "${RED}✗ PKCS12 fullchain is invalid${NC}"
        fi
    fi

    # Validate root certificates
    if [ -f "isrg-root-x1.pem" ]; then
        VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
        if openssl x509 -in "isrg-root-x1.pem" -noout -text >/dev/null 2>&1; then
            echo -e "${GREEN}✓ ISRG Root X1 is valid${NC}"
            VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
        else
            echo -e "${RED}✗ ISRG Root X1 is invalid${NC}"
        fi
    fi

    echo -e "\nValidation: $VALIDATION_PASSED/$VALIDATION_TESTS files are valid"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}API Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
else
    echo -e "Failed:        $FAILED_TESTS"
fi
echo -e "\n${YELLOW}Downloaded files are in: $OUTPUT_DIR${NC}"
echo -e "${BLUE}========================================${NC}"

# Exit code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
else
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
fi
