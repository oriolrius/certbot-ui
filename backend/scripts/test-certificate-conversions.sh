#!/bin/bash

# Certificate Download Format Testing Script
# This script validates that all certificate formats can be converted correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="/tmp/cert-download-test"
TEST_CERT_NAME="test.example.com"
TEST_PASSWORD="testpassword123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Certificate Format Conversion Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

command -v openssl >/dev/null 2>&1 || {
    echo -e "${RED}✗ OpenSSL is not installed${NC}"
    exit 1
}
echo -e "${GREEN}✓ OpenSSL found: $(openssl version)${NC}"

if command -v keytool >/dev/null 2>&1; then
    KEYTOOL_AVAILABLE=true
    echo -e "${GREEN}✓ Keytool found: $(keytool -version 2>&1 | head -1)${NC}"
else
    KEYTOOL_AVAILABLE=false
    echo -e "${YELLOW}⚠ Keytool not found - JKS tests will be skipped${NC}"
    echo -e "${YELLOW}  Install Java JDK to enable JKS format testing${NC}"
fi

# Setup test directory
echo -e "\n${YELLOW}Setting up test environment...${NC}"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"
echo -e "${GREEN}✓ Test directory created: $TEST_DIR${NC}"

# Generate test certificate and key
echo -e "\n${YELLOW}Generating test certificate...${NC}"
openssl req -x509 -newkey rsa:2048 -keyout privkey.pem -out cert.pem \
    -days 365 -nodes -subj "/CN=$TEST_CERT_NAME" 2>/dev/null

# Create chain (self-signed, so chain is same as cert)
cp cert.pem chain.pem

# Create fullchain (cert + chain)
cat cert.pem chain.pem > fullchain.pem

echo -e "${GREEN}✓ Test certificate generated${NC}"
echo -e "  Subject: $TEST_CERT_NAME"
echo -e "  Files: cert.pem, chain.pem, fullchain.pem, privkey.pem"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local validation_command="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "\n${BLUE}Test $TOTAL_TESTS: $test_name${NC}"

    if eval "$test_command" 2>/dev/null; then
        if [ -n "$validation_command" ]; then
            if eval "$validation_command" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ PASSED${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                return 0
            else
                echo -e "${RED}✗ FAILED (validation failed)${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            fi
        else
            echo -e "${GREEN}✓ PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        fi
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

skip_test() {
    local test_name="$1"
    local reason="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))

    echo -e "\n${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    echo -e "${YELLOW}⊘ SKIPPED: $reason${NC}"
}

# Test PEM format (baseline)
echo -e "\n${BLUE}=== PEM Format Tests ===${NC}"

run_test "PEM: cert.pem is valid" \
    "test -f cert.pem" \
    "openssl x509 -in cert.pem -noout -text"

run_test "PEM: fullchain.pem is valid" \
    "test -f fullchain.pem" \
    "openssl x509 -in fullchain.pem -noout -text"

run_test "PEM: privkey.pem is valid" \
    "test -f privkey.pem" \
    "openssl rsa -in privkey.pem -check -noout"

run_test "PEM: bundle (cert + key) creation" \
    "cat fullchain.pem privkey.pem > bundle.pem" \
    "test -f bundle.pem"

# Test DER format
echo -e "\n${BLUE}=== DER Format Tests ===${NC}"

run_test "DER: Convert cert.pem to cert.der" \
    "openssl x509 -in cert.pem -out cert.der -outform DER" \
    "openssl x509 -in cert.der -inform DER -noout -text"

run_test "DER: Convert fullchain.pem to fullchain.der" \
    "openssl x509 -in fullchain.pem -out fullchain.der -outform DER" \
    "openssl x509 -in fullchain.der -inform DER -noout -text"

run_test "DER: Convert privkey.pem to privkey.der" \
    "openssl rsa -in privkey.pem -out privkey.der -outform DER" \
    "openssl rsa -in privkey.der -inform DER -check -noout"

# Test P7B format
echo -e "\n${BLUE}=== PKCS#7 (P7B) Format Tests ===${NC}"

run_test "P7B: Convert cert.pem to cert.p7b" \
    "openssl crl2pkcs7 -nocrl -certfile cert.pem -out cert.p7b" \
    "openssl pkcs7 -in cert.p7b -print_certs -noout"

run_test "P7B: Convert fullchain.pem to fullchain.p7b" \
    "openssl crl2pkcs7 -nocrl -certfile fullchain.pem -out fullchain.p7b" \
    "openssl pkcs7 -in fullchain.p7b -print_certs -noout"

run_test "P7B: Convert chain.pem to chain.p7b" \
    "openssl crl2pkcs7 -nocrl -certfile chain.pem -out chain.p7b" \
    "openssl pkcs7 -in chain.p7b -print_certs -noout"

# Test PKCS12 format
echo -e "\n${BLUE}=== PKCS#12 (PFX/P12) Format Tests ===${NC}"

run_test "PKCS12: Convert cert + privkey to cert.p12" \
    "openssl pkcs12 -export -out cert.p12 -inkey privkey.pem -in cert.pem -password pass:$TEST_PASSWORD" \
    "openssl pkcs12 -in cert.p12 -noout -password pass:$TEST_PASSWORD"

run_test "PKCS12: Convert fullchain + privkey to fullchain.p12" \
    "openssl pkcs12 -export -out fullchain.p12 -inkey privkey.pem -in fullchain.pem -password pass:$TEST_PASSWORD" \
    "openssl pkcs12 -in fullchain.p12 -noout -password pass:$TEST_PASSWORD"

run_test "PKCS12: Extract certificate from fullchain.p12" \
    "openssl pkcs12 -in fullchain.p12 -clcerts -nokeys -out extracted-cert.pem -password pass:$TEST_PASSWORD -passin pass:$TEST_PASSWORD" \
    "openssl x509 -in extracted-cert.pem -noout -text"

run_test "PKCS12: Extract private key from fullchain.p12" \
    "openssl pkcs12 -in fullchain.p12 -nocerts -nodes -out extracted-key.pem -password pass:$TEST_PASSWORD -passin pass:$TEST_PASSWORD" \
    "openssl rsa -in extracted-key.pem -check -noout"

# Test JKS format
echo -e "\n${BLUE}=== Java KeyStore (JKS) Format Tests ===${NC}"

if [ "$KEYTOOL_AVAILABLE" = true ]; then
    run_test "JKS: Convert PKCS12 to JKS (cert)" \
        "keytool -importkeystore -srckeystore cert.p12 -srcstoretype PKCS12 -srcstorepass $TEST_PASSWORD -destkeystore cert.jks -deststoretype JKS -deststorepass $TEST_PASSWORD -noprompt" \
        "keytool -list -keystore cert.jks -storepass $TEST_PASSWORD"

    run_test "JKS: Convert PKCS12 to JKS (fullchain)" \
        "keytool -importkeystore -srckeystore fullchain.p12 -srcstoretype PKCS12 -srcstorepass $TEST_PASSWORD -destkeystore fullchain.jks -deststoretype JKS -deststorepass $TEST_PASSWORD -noprompt" \
        "keytool -list -keystore fullchain.jks -storepass $TEST_PASSWORD"

    run_test "JKS: Verify certificate alias in keystore" \
        "keytool -list -keystore fullchain.jks -storepass $TEST_PASSWORD -alias 1" \
        "keytool -list -keystore fullchain.jks -storepass $TEST_PASSWORD | grep -q 'PrivateKeyEntry'"
else
    skip_test "JKS: Convert PKCS12 to JKS (cert)" "Keytool not available"
    skip_test "JKS: Convert PKCS12 to JKS (fullchain)" "Keytool not available"
    skip_test "JKS: Verify certificate alias in keystore" "Keytool not available"
fi

# Test CRT format (alias for PEM)
echo -e "\n${BLUE}=== CRT Format Tests ===${NC}"

run_test "CRT: Copy cert.pem to cert.crt" \
    "cp cert.pem cert.crt" \
    "openssl x509 -in cert.crt -noout -text"

run_test "CRT: Copy fullchain.pem to fullchain.crt" \
    "cp fullchain.pem fullchain.crt" \
    "openssl x509 -in fullchain.crt -noout -text"

# Test CER format (DER with .cer extension)
echo -e "\n${BLUE}=== CER Format Tests ===${NC}"

run_test "CER: Convert cert.pem to cert.cer (DER)" \
    "openssl x509 -in cert.pem -out cert.cer -outform DER" \
    "openssl x509 -in cert.cer -inform DER -noout -text"

run_test "CER: Convert fullchain.pem to fullchain.cer (DER)" \
    "openssl x509 -in fullchain.pem -out fullchain.cer -outform DER" \
    "openssl x509 -in fullchain.cer -inform DER -noout -text"

# Round-trip tests
echo -e "\n${BLUE}=== Round-Trip Conversion Tests ===${NC}"

run_test "Round-trip: PEM -> DER -> PEM" \
    "openssl x509 -in cert.pem -out temp.der -outform DER && openssl x509 -in temp.der -inform DER -out temp.pem -outform PEM" \
    "diff -q cert.pem temp.pem"

run_test "Round-trip: PEM -> PKCS12 -> PEM" \
    "openssl pkcs12 -export -out temp.p12 -inkey privkey.pem -in cert.pem -password pass:$TEST_PASSWORD && openssl pkcs12 -in temp.p12 -clcerts -nokeys -out temp-cert.pem -password pass:$TEST_PASSWORD -passin pass:$TEST_PASSWORD" \
    "openssl x509 -in temp-cert.pem -noout -text"

# File size comparisons
echo -e "\n${BLUE}=== Format Size Comparison ===${NC}"

echo -e "\n${YELLOW}Certificate file sizes:${NC}"
[ -f cert.pem ] && echo -e "  cert.pem:       $(stat -f%z cert.pem 2>/dev/null || stat -c%s cert.pem) bytes"
[ -f cert.der ] && echo -e "  cert.der:       $(stat -f%z cert.der 2>/dev/null || stat -c%s cert.der) bytes"
[ -f cert.p7b ] && echo -e "  cert.p7b:       $(stat -f%z cert.p7b 2>/dev/null || stat -c%s cert.p7b) bytes"
[ -f cert.p12 ] && echo -e "  cert.p12:       $(stat -f%z cert.p12 2>/dev/null || stat -c%s cert.p12) bytes"
[ -f cert.jks ] && echo -e "  cert.jks:       $(stat -f%z cert.jks 2>/dev/null || stat -c%s cert.jks) bytes"

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
else
    echo -e "Failed:        $FAILED_TESTS"
fi
if [ $SKIPPED_TESTS -gt 0 ]; then
    echo -e "${YELLOW}Skipped:       $SKIPPED_TESTS${NC}"
else
    echo -e "Skipped:       $SKIPPED_TESTS"
fi
echo -e "${BLUE}========================================${NC}"

# Clean up
echo -e "\n${YELLOW}Cleaning up...${NC}"
cd /
rm -rf "$TEST_DIR"
echo -e "${GREEN}✓ Test directory removed${NC}"

# Exit code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
else
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
fi
