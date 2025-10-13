# Certificate Download Testing Guide

This directory contains comprehensive tests for validating certificate download functionality across all supported formats.

## Test Suites

### 1. Unit Tests (`certificate-download.service.test.ts`)

**Location:** `backend/src/__tests__/certificate-download.service.test.ts`

**Purpose:** Tests the service logic, filename generation, MIME types, and validation rules.

**Run:**
```bash
npm test certificate-download.service.test.ts
```

**Coverage:**
- ✅ Filename generation and sanitization
- ✅ MIME type mapping
- ✅ Format-component compatibility validation
- ✅ Password requirement validation
- ✅ Root certificate retrieval
- ✅ Format compatibility matrix documentation

**Expected Output:**
```
✓ should generate correct filename for PEM fullchain
✓ should sanitize certificate names with special characters
✓ should return correct MIME type for PKCS12
✓ should require password for PKCS12 format
...
```

---

### 2. Certificate Conversion Tests (`test-certificate-conversions.sh`)

**Location:** `backend/scripts/test-certificate-conversions.sh`

**Purpose:** Validates that OpenSSL can convert between all certificate formats correctly.

**Prerequisites:**
- `openssl` (required)
- `keytool` (optional, for JKS tests)

**Run:**
```bash
chmod +x backend/scripts/test-certificate-conversions.sh
./backend/scripts/test-certificate-conversions.sh
```

**What it tests:**
1. **PEM Format** - Baseline certificate format
   - cert.pem validation
   - fullchain.pem validation
   - privkey.pem validation
   - bundle creation

2. **DER Format** - Binary certificate format
   - PEM to DER conversion
   - DER validation
   - Private key conversion

3. **PKCS#7 (P7B)** - Certificate chain format
   - Certificate to P7B conversion
   - Chain validation

4. **PKCS#12 (PFX/P12)** - Archive format with private key
   - Certificate + key to PKCS12
   - Password protection
   - Certificate extraction
   - Key extraction

5. **JKS** - Java KeyStore format (if keytool available)
   - PKCS12 to JKS conversion
   - KeyStore validation
   - Alias verification

6. **CRT/CER** - Alternative extensions
   - Format validation

7. **Round-trip Conversions**
   - PEM → DER → PEM
   - PEM → PKCS12 → PEM

8. **File Size Comparisons**
   - Relative sizes of different formats

**Expected Output:**
```
========================================
Certificate Format Conversion Test Suite
========================================

Checking prerequisites...
✓ OpenSSL found: OpenSSL 3.x
✓ Keytool found: keytool 17.x

Test 1: PEM: cert.pem is valid
✓ PASSED

Test 2: DER: Convert cert.pem to cert.der
✓ PASSED

...

========================================
Test Summary
========================================
Total tests:   30
Passed:        30
Failed:        0
Skipped:       0
========================================

All tests passed!
```

---

### 3. API Endpoint Tests (`test-download-api.sh`)

**Location:** `backend/scripts/test-download-api.sh`

**Purpose:** Tests the actual HTTP API endpoints with real certificates from your Let's Encrypt installation.

**Prerequisites:**
- Running Certbot UI backend
- At least one obtained certificate
- Valid login credentials
- `curl` and `jq` installed

**Run:**
```bash
chmod +x backend/scripts/test-download-api.sh
./backend/scripts/test-download-api.sh
```

**Environment Variables:**
```bash
# Optional: specify API URL (default: http://localhost:5000/api)
export API_BASE_URL="http://localhost:5000/api"

# Optional: provide auth token directly
export API_TOKEN="your-jwt-token"
```

**What it tests:**
1. **Authentication** - Login and token retrieval
2. **Certificate Discovery** - List available certificates
3. **PEM Downloads** - All components (cert, fullchain, chain, privkey, bundle)
4. **DER Downloads** - All compatible components
5. **P7B Downloads** - Certificate and chain downloads
6. **PKCS12 Downloads** - Password-protected archives
7. **JKS Downloads** - Java KeyStore (if keytool available)
8. **CRT Downloads** - Alternative PEM extension
9. **CER Downloads** - Windows-compatible DER format
10. **Root CA Downloads** - ISRG Root X1 and X2
11. **File Validation** - OpenSSL verification of downloaded files

**Expected Output:**
```
========================================
Certificate Download API Test Suite
========================================

✓ curl found
✓ jq found

Authentication required
Username: admin
Password: ****

✓ Logged in successfully
✓ Found 2 certificate(s)
✓ Using certificate: example.com

=== Testing PEM Format ===

Test 1: PEM fullchain
  Certificate: example.com
  Format: pem, Component: fullchain
✓ PASSED (HTTP 200, file size: 3456 bytes)

...

=== Validating Downloaded Files ===
✓ PEM fullchain is valid
✓ DER fullchain is valid
✓ PKCS12 fullchain is valid
✓ ISRG Root X1 is valid

========================================
API Test Summary
========================================
Total tests:   25
Passed:        25
Failed:        0

Downloaded files are in: /tmp/cert-api-test
========================================

All tests passed!
```

---

## Format Compatibility Matrix

### Supported Combinations

| Format | cert | fullchain | chain | privkey | bundle |
|--------|------|-----------|-------|---------|--------|
| **PEM** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DER** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **P7B** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **PKCS12** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **JKS** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **CRT** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CER** | ✅ | ✅ | ✅ | ✅ | ❌ |

### Format Details

**PEM (.pem)**
- Supports: All components
- Password: Not required
- Use: Apache, Nginx, most servers

**DER (.der)**
- Supports: All except bundle
- Password: Not required
- Use: Java, Windows, binary processing

**P7B (.p7b)**
- Supports: cert, fullchain, chain only
- Password: Not required
- Use: Windows, Tomcat

**PKCS12 (.pkcs12/.pfx/.p12)**
- Supports: cert, fullchain, bundle
- Password: **Required**
- Use: Windows IIS, import/export

**JKS (.jks)**
- Supports: cert, fullchain, bundle
- Password: **Required**
- Requires: keytool (Java JDK)
- Use: Java applications, Tomcat

**CRT (.crt)**
- Same as PEM
- Supports: All components
- Password: Not required

**CER (.cer)**
- Same as DER
- Supports: All except bundle
- Password: Not required
- Use: Windows

---

## Running All Tests

### Quick Test Suite

```bash
# 1. Run unit tests
cd backend
npm test certificate-download

# 2. Run conversion tests
./scripts/test-certificate-conversions.sh

# 3. Run API tests (requires running server + certificate)
./scripts/test-download-api.sh
```

### Docker Test Suite

```bash
# Test inside the backend container
docker compose exec backend npm test certificate-download

# Test conversions inside container
docker compose exec backend bash -c "chmod +x scripts/test-certificate-conversions.sh && scripts/test-certificate-conversions.sh"

# Test API from host
./backend/scripts/test-download-api.sh
```

---

## Troubleshooting

### Issue: OpenSSL not found
```bash
# Install OpenSSL
# Ubuntu/Debian
sudo apt-get install openssl

# macOS
brew install openssl

# Alpine (Docker)
apk add openssl
```

### Issue: Keytool not found (JKS tests fail)
```bash
# Install Java JDK
# Ubuntu/Debian
sudo apt-get install default-jdk

# macOS
brew install openjdk

# Alpine (Docker)
apk add openjdk11
```

### Issue: API tests fail with 401 Unauthorized
- Check your username and password
- Ensure the backend is running on the correct port
- Verify API_BASE_URL environment variable

### Issue: No certificates found
- Obtain at least one certificate first through the UI
- Use staging mode for testing

### Issue: Certificate not found error
- Ensure the certificate name matches exactly (including domain)
- Check `/etc/letsencrypt/live/` directory

---

## Test Coverage Summary

✅ **Unit Tests** (25+ tests)
- Filename generation
- MIME types
- Validation rules
- Compatibility matrix

✅ **Conversion Tests** (30+ tests)
- All format conversions
- Round-trip conversions
- File validation
- Size comparisons

✅ **API Integration Tests** (25+ tests)
- All endpoints
- All formats
- All components
- Root CA downloads
- File validation

**Total: 80+ automated tests**

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Certificate Download Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd backend && npm install

      - name: Run unit tests
        run: cd backend && npm test certificate-download

      - name: Install OpenSSL
        run: sudo apt-get install -y openssl

      - name: Install Java (for JKS tests)
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Run conversion tests
        run: |
          chmod +x backend/scripts/test-certificate-conversions.sh
          ./backend/scripts/test-certificate-conversions.sh
```

---

## Manual Testing Checklist

For comprehensive manual testing:

- [ ] PEM fullchain download works
- [ ] PEM cert-only download works
- [ ] DER format downloads correctly
- [ ] PKCS12 with password works
- [ ] PKCS12 without password fails with proper error
- [ ] JKS format works (if keytool available)
- [ ] P7B format excludes private key
- [ ] Bundle includes both cert and key
- [ ] Root CA X1 downloads
- [ ] Root CA X2 downloads
- [ ] Filenames don't have trailing underscores
- [ ] Downloaded files open in appropriate tools
- [ ] Windows imports PKCS12 successfully
- [ ] Java imports JKS successfully
- [ ] Nginx accepts PEM bundle

---

## Contributing

When adding new formats or features:

1. Add unit tests to `certificate-download.service.test.ts`
2. Add conversion tests to `test-certificate-conversions.sh`
3. Add API tests to `test-download-api.sh`
4. Update this documentation
5. Update the compatibility matrix
6. Run all test suites before submitting PR

---

## Support

For issues or questions about testing:
- Check troubleshooting section above
- Review test output for specific errors
- Ensure all prerequisites are installed
- Verify OpenSSL and keytool versions

**Recommended Versions:**
- OpenSSL: 1.1.1+ or 3.0+
- Java/Keytool: 11+ (for JKS support)
- Node.js: 18+ or 20+
