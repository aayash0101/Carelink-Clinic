# 🧪 Testing & Verification Guide - Luxaro

## Table of Contents

1. [Manual Testing](#manual-testing)
2. [Automated Testing](#automated-testing)
3. [Postman Collection](#postman-collection)
4. [Security Testing](#security-testing)
5. [Penetration Testing](#penetration-testing)
6. [Performance Testing](#performance-testing)

---

## Manual Testing

### Test Environment Setup

```bash
# 1. Start MongoDB
mongod

# 2. Start Backend
npm run server

# 3. Start Frontend
npm run client

# 4. Open Postman or use curl
```

---

### 1. Password Security Testing

#### Test Case 1.1: Reject Short Password

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Short1!",
    "name": "Test User",
    "phone": "9841234567"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": ["Password must be at least 12 characters long"]
}
```

**Status**: 400 Bad Request

---

#### Test Case 1.2: Reject No Uppercase

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "validpass123!",
    "name": "Test User",
    "phone": "9841234567"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": ["Password must contain at least one uppercase letter"]
}
```

---

#### Test Case 1.3: Reject No Numbers

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@example.com",
    "password": "ValidPass!@#",
    "name": "Test User",
    "phone": "9841234567"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": ["Password must contain at least one number"]
}
```

---

#### Test Case 1.4: Reject No Special Characters

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test4@example.com",
    "password": "ValidPass123",
    "name": "Test User",
    "phone": "9841234567"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Password does not meet security requirements",
  "errors": ["Password must contain at least one special character"]
}
```

---

#### Test Case 1.5: Reject Common Passwords

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test5@example.com",
    "password": "Password123!@#",
    "name": "Test User",
    "phone": "9841234567"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Password is too common. Choose a stronger password."
}
```

---

#### Test Case 1.6: Accept Valid Password

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validuser@example.com",
    "password": "SecurePass123!@#",
    "name": "Valid User",
    "phone": "9841234567"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Valid User",
      "email": "validuser@example.com",
      "role": "user"
    }
  }
}
```

**Status**: 201 Created

---

#### Database Verification

```javascript
// Connect to MongoDB
use luxaro;

// Check password is hashed, not plaintext
db.users.findOne({email: "validuser@example.com"});

// Expected output:
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Valid User",
  "email": "validuser@example.com",
  "password": "$2b$10$4bP3Rl.o6Kz...",  // bcrypt hash
  "role": "user",
  "createdAt": ISODate("2026-01-23T20:00:00Z")
}
```

---

### 2. Brute Force Prevention Testing

#### Test Case 2.1: First Failed Attempt

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validuser@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Status**: 401 Unauthorized

---

#### Test Case 2.2: Attempt 3 (reCAPTCHA Required)

Run failed login 3 times:

```bash
for i in {1..3}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "validuser@example.com",
      "password": "WrongPassword"
    }'
done
```

**Third Attempt Response:**

```json
{
  "success": false,
  "message": "Security verification required",
  "requiresRecaptcha": true
}
```

---

#### Test Case 2.3: Attempt 5 (Account Locked)

Run failed login 5 times:

```bash
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "validuser@example.com",
      "password": "WrongPassword"
    }'
  sleep 1
done
```

**Fifth Attempt Response:**

```json
{
  "success": false,
  "message": "Account locked due to multiple failed attempts. Try again in 30 minute(s)."
}
```

**Status**: 423 Locked

---

#### Test Case 2.4: Verify Account Lock in Database

```javascript
// Check user document
db.users.findOne({email: "validuser@example.com"});

// Expected output:
{
  "loginAttempts": 5,
  "lockUntil": ISODate("2026-01-23T20:30:00Z"),  // 30 minutes from now
  // ... other fields
}
```

---

#### Test Case 2.5: Account Unlock After 30 Minutes

```bash
# Wait 30 minutes or manually update in MongoDB
db.users.updateOne(
  {email: "validuser@example.com"},
  {$set: {lockUntil: null, loginAttempts: 0}}
);

# Now login should work with correct password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validuser@example.com",
    "password": "SecurePass123!@#"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Valid User",
      "email": "validuser@example.com",
      "role": "user"
    }
  }
}
```

---

### 3. RBAC Testing

#### Test Case 3.1: Regular User Cannot Access Admin

**Step 1: Create regular user**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regularuser@example.com",
    "password": "SecurePass123!@#",
    "name": "Regular User",
    "phone": "9841234567"
  }'
```

**Step 2: Login and get token**

```bash
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regularuser@example.com",
    "password": "SecurePass123!@#"
  }' | jq -r '.token')

echo $TOKEN
```

**Step 3: Try to access admin endpoint**

```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "requiredRoles": ["admin"],
  "userRole": "user"
}
```

**Status**: 403 Forbidden

---

#### Test Case 3.2: Admin Can Access Admin Endpoints

**Step 1: Create admin user in database**

```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2b$10$...", // bcrypt hash of AdminPass123!@#
  phone: "9841234567",
  role: "admin",
  isActive: true,
});
```

**Step 2: Login as admin**

```bash
ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!@#"
  }' | jq -r '.token')
```

**Step 3: Access admin endpoint**

```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Regular User",
      "email": "regularuser@example.com",
      "role": "user"
    }
    // ... more users
  ]
}
```

**Status**: 200 OK

---

### 4. Session Management Testing

#### Test Case 4.1: Check Secure Cookie

**Step 1: Login**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "validuser@example.com",
    "password": "SecurePass123!@#"
  }'
```

**Step 2: Check saved cookies**

```bash
cat cookies.txt
```

**Expected Output:**

```
# Netscape HTTP Cookie File
.localhost	TRUE	/	FALSE	1706038800	token	eyJhbGc...
```

**Step 3: Inspect in browser**

- Open http://localhost:5173
- Login
- Open DevTools (F12)
- Go to Application > Cookies > localhost:5173
- Find `token` cookie
- Verify properties:
  - ✅ HttpOnly: true (cannot be accessed by JavaScript)
  - ✅ Secure: false (localhost) or true (HTTPS in production)
  - ✅ SameSite: Strict

---

#### Test Case 4.2: Session Expires After 7 Days

**Database Check:**

```javascript
db.sessions.findOne({userId: ObjectId("507f1f77bcf86cd799439011")});

// Expected output:
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "sessionId": "sess_...",
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "expiresAt": ISODate("2026-01-30T20:00:00Z"),  // 7 days from now
  "lastActivity": ISODate("2026-01-23T20:00:00Z"),
  "createdAt": ISODate("2026-01-23T20:00:00Z")
}
```

---

#### Test Case 4.3: Logout Deletes Session

**Step 1: Login**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validuser@example.com",
    "password": "SecurePass123!@#"
  }'
```

**Step 2: Logout**

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Cookie: token=eyJhbGc..."
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Step 3: Verify session deleted**

```javascript
db.sessions.findOne({ sessionId: "sess_..." });
// Returns: null (session deleted)
```

---

### 5. Data Encryption Testing

#### Test Case 5.1: Phone Encryption

**Step 1: Register user**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "encrypt@example.com",
    "password": "SecurePass123!@#",
    "name": "Encrypt Test",
    "phone": "9841234567"
  }'
```

**Step 2: Check database**

```javascript
db.users.findOne({email: "encrypt@example.com"});

// Expected output:
{
  "name": "Encrypt Test",
  "email": "encrypt@example.com",
  "phone": "3a4b5c6d7e8f9g0h1i2j:1a2b3c4d5e6f7g8h:9z8y7x6w5v4u3t2s",
  // phone is encrypted (iv:authTag:encryptedData format)
}
```

**Step 3: Check API response**

```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Encrypt Test",
      "email": "encrypt@example.com",
      "phone": "9841234567" // Decrypted for API response
    }
  }
}
```

---

### 6. Audit Logging Testing

#### Test Case 6.1: Login Event Logged

```javascript
// After successful login, check audit log
db.auditlogs.findOne({
  eventType: "USER_LOGIN",
  email: "validuser@example.com"
});

// Expected output:
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "eventType": "USER_LOGIN",
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "email": "validuser@example.com",
  "ip": "127.0.0.1",
  "userAgent": "curl/7.64.1",
  "timestamp": ISODate("2026-01-23T20:00:00Z"),
  "severity": "LOW"
}
```

---

#### Test Case 6.2: Failed Login Logged

```bash
# Attempt failed login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validuser@example.com",
    "password": "WrongPassword"
  }'
```

```javascript
// Check database
db.auditlogs.findOne({
  eventType: "LOGIN_FAILED",
  email: "validuser@example.com"
});

// Expected output:
{
  "eventType": "LOGIN_FAILED",
  "email": "validuser@example.com",
  "ip": "127.0.0.1",
  "timestamp": ISODate("2026-01-23T20:00:00Z"),
  "severity": "MEDIUM"
}
```

---

### 7. XSS Prevention Testing

#### Test Case 7.1: XSS Script Tag Removal

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "xss@example.com",
    "password": "SecurePass123!@#",
    "name": "<script>alert(\"XSS\")</script>User",
    "phone": "9841234567"
  }'
```

```javascript
// Check database
db.users.findOne({email: "xss@example.com"});

// Expected output:
{
  "name": "User",  // Script tag removed
  "email": "xss@example.com"
}
```

---

#### Test Case 7.2: XSS Event Handler Removal

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Product",
    "description": "<img src=x onerror=alert(\"XSS\")>",
    "price": 100
  }'
```

```javascript
// Check database
db.products.findOne({name: "Product"});

// Expected output:
{
  "name": "Product",
  "description": "<img src=x>",  // onerror handler removed
  "price": 100
}
```

---

### 8. CSRF Protection Testing

#### Test Case 8.1: Request Without CSRF Token

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "...", "quantity": 1}],
    "address": "123 Main St"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "CSRF token required"
}
```

**Status**: 403 Forbidden

---

#### Test Case 8.2: Request With Invalid CSRF Token

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid-token" \
  -d '{
    "items": [{"productId": "...", "quantity": 1}],
    "address": "123 Main St"
  }'
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid CSRF token"
}
```

---

#### Test Case 8.3: Request With Valid CSRF Token

```bash
# Get CSRF token
CSRF=$(curl http://localhost:5000/api/csrf-token | jq -r '.token')

# Use token
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{
    "items": [{"productId": "507f1f77bcf86cd799439030", "quantity": 1}],
    "address": "123 Main St"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439040",
    "totalPrice": 100,
    "status": "pending"
  }
}
```

**Status**: 201 Created

---

### 9. Security Headers Testing

#### Test Case 9.1: Check All Security Headers

```bash
curl -i http://localhost:5000/
```

**Expected Response Headers:**

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: deny
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; ...
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

#### Test Case 9.2: CSP Policy Test

```bash
# Try to load external script (should be blocked by CSP)
curl -X GET http://localhost:5000/ \
  -H "Accept: text/html"
```

Check browser console for CSP violation messages (if applicable).

---

## Automated Testing

### Run Security Tests

```bash
npm run test:security
```

### Test File Structure

```bash
# backend/tests/security.test.js
describe('Password Security', () => {
  it('should reject passwords < 12 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        password: 'short',
        name: 'Test',
        phone: '9841234567'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('at least 12 characters');
  });
});
```

---

## Postman Collection

### Import Collection

1. Open Postman
2. Click "Import"
3. Upload: `docs/postman-collection.json`
4. Environment: Select "Luxaro Dev"

### Example Test

**POST /api/auth/login**

```json
{
  "email": "test@test.com",
  "password": "ValidPass123!@#"
}
```

Expected: 200 OK with token

---

## Security Testing

### Rate Limiting Test

```bash
# Make 100 requests in quick succession
for i in {1..100}; do
  curl -X GET http://localhost:5000/api/products &
done
```

Expected: After ~20 requests, get 429 Too Many Requests

---

### SQL/NoSQL Injection Test

```bash
# NoSQL injection attempt
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": ""},
    "password": {"$ne": ""}
  }'
```

Expected: Injection attempt blocked, request sanitized

---

## Penetration Testing

### Common Attack Scenarios

**1. Account Takeover**

- ✅ Mitigated by: Brute force protection, reCAPTCHA, MFA
- Test: 5 failed logins → account locked

**2. Data Breach**

- ✅ Mitigated by: AES-256 encryption, HTTPS
- Test: Check database for encrypted fields

**3. Privilege Escalation**

- ✅ Mitigated by: RBAC, permission checks
- Test: Regular user cannot access admin endpoints

**4. Session Hijacking**

- ✅ Mitigated by: Secure cookies, JWT validation
- Test: Can't use invalid tokens

**5. XSS Attack**

- ✅ Mitigated by: Input sanitization, CSP
- Test: Script tags removed from input

---

## Performance Testing

### Load Test

```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:5000/api/products
```

---

## Test Checklist

- [ ] All password requirements enforced
- [ ] Brute force protection working
- [ ] RBAC preventing unauthorized access
- [ ] Sessions stored securely
- [ ] Sensitive data encrypted
- [ ] Audit logs recorded
- [ ] XSS attacks blocked
- [ ] CSRF tokens validated
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] No sensitive data in logs
- [ ] Error messages generic

---

**Happy Testing! 🧪**
