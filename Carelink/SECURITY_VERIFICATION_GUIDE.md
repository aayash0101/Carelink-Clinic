# 🔒 SECURITY VERIFICATION GUIDE - Luxaro

## Practical Step-by-Step Testing in Website (User Level)

**Purpose**: This guide shows you how to check if each security feature is working properly by using the website normally.

**Date**: January 23, 2026
**Project**: Luxaro E-Commerce Platform
**Target**: Manual security verification using browser + website

---

## 📌 BEFORE YOU START

### Prerequisites

- Backend running: `npm run dev` (or on port 5000)
- Frontend running: `npm run dev` (or on port 5173)
- Website accessible: `http://localhost:5173`
- Browser: Chrome/Firefox with DevTools (F12)
- MongoDB: Running locally or Atlas connected

### Important Files to Keep Open

1. Browser with website: `http://localhost:5173`
2. Browser DevTools: Press `F12`
3. MongoDB Atlas/Local: To check database records (optional)

---

## ✅ SECURITY CHECK #1: PASSWORD SECURITY

### What This Protects

Ensures strong passwords are required - prevents weak passwords like "123456" or "password"

### How to Test - Step by Step

#### Step 1: Go to Registration Page

1. Open website: `http://localhost:5173`
2. Click "Register" or "Sign Up" button
3. You should see registration form with email, password, confirm password fields

#### Step 2: Try Weak Passwords (Should FAIL)

Try these passwords one by one and see what happens:

**Test 1: Password too short**

```
Password: "hello"
Expected: Red error message saying "At least 12 characters"
Screenshot: Take screenshot of error message
```

**Test 2: No uppercase**

```
Password: "password123!@#"
Expected: Red error message saying "At least one uppercase letter"
Screenshot: Take screenshot of error message
```

**Test 3: No special character**

```
Password: "HelloWorld123"
Expected: Red error message saying "At least one special character"
Screenshot: Take screenshot of error message
```

**Test 4: Watch the Password Strength Meter**
While typing password:

```
Weak Password (RED): "hello123A!"
Medium Password (YELLOW): "Hello123456!"
Strong Password (GREEN): "Hello@World123456!"
```

- **Look for**: Color changing from red → yellow → green as you improve password
- **Screenshot**: Show all three strength levels

#### Step 3: Create Valid Account

```
Email: testuser@example.com
Password: TestSecure@123
Confirm: TestSecure@123
```

**Expected Results**:
✅ Green "Strong" indicator shows
✅ Register button becomes clickable
✅ Account created successfully
✅ Check: Go to MongoDB and look for this user with encrypted password (not plaintext)

---

## ✅ SECURITY CHECK #2: BRUTE FORCE PROTECTION

### What This Protects

Prevents hackers from trying thousands of password combinations to guess your login

### How to Test - Step by Step

#### Step 1: Go to Login Page

1. Open website: `http://localhost:5173`
2. Click "Login" button
3. You should see login form

#### Step 2: Try Wrong Passwords 5 Times

Use account you created above or existing account:

```
Email: testuser@example.com
```

**Attempt 1**: Wrong password

```
Password: WrongPassword1
Click "Login"
Expected: "Invalid credentials" error (red message)
```

**Attempt 2**: Wrong password again

```
Password: WrongPassword2
Click "Login"
Expected: Same error message
Note: Count = 2 attempts
```

**Attempt 3, 4, 5**: Repeat wrong password

```
After each attempt: Same error message
Note: Watch the number of failed attempts (if shown)
Count = 5 attempts total
```

#### Step 3: On 5th Failed Attempt - ACCOUNT LOCKED

**This is the security feature in action!**

```
After 5th wrong password attempt:
Expected Results:
❌ "Account locked. Try again in 30 minutes"
❌ Red error message appears
❌ Login button disabled or greyed out
❌ Cannot login even with correct password
```

**Take Screenshot**: Show the account locked message

#### Step 4: Wait and Try Again

```
Option A: Wait 30 minutes (or until lockout expires)
Option B: Check backend logs to see lockout recorded
Option C: Check database - user document shows "lockUntil" timestamp
```

#### Step 5: Also Look For reCAPTCHA

On login page after 3 failed attempts:

```
Expected: Google reCAPTCHA box appears
Note: "I'm not a robot" checkbox visible
This prevents automated attacks
```

**Take Screenshot**: Show reCAPTCHA on login page

---

## ✅ SECURITY CHECK #3: ROLE-BASED ACCESS CONTROL (RBAC)

### What This Protects

Regular users cannot access admin pages or perform admin actions

### How to Test - Step by Step

#### Step 1: Create Two Test Accounts

**Regular User Account:**

```
Email: regularuser@example.com
Password: RegularUser@123
Role: User (default)
```

**Admin Account:** (if you have admin access)

```
Email: admin@example.com
Password: AdminSecure@123
Role: Admin
```

#### Step 2: Login as Regular User

1. Login with regularuser@example.com
2. You should see regular user dashboard
3. Look for: "Products", "Cart", "Orders" only
4. NO "Admin Dashboard" option

#### Step 3: Try to Access Admin Page Directly

While logged in as regular user:

```
Try typing admin URL in browser: http://localhost:5173/admin
Expected:
❌ Access Denied (403 Forbidden) OR
❌ Redirects to home page OR
❌ Shows "Unauthorized" message
Screenshot: Take screenshot of error
```

#### Step 4: Logout and Login as Admin

1. Click "Logout"
2. Login with admin account
3. You should see: "Admin Dashboard" option in menu
4. Click it and see: User management, Product management, Orders, etc.

#### Step 5: Compare Permissions

| Page            | Regular User  | Admin                  |
| --------------- | ------------- | ---------------------- |
| Home            | ✅ Can access | ✅ Can access          |
| Products        | ✅ Can view   | ✅ Can view + manage   |
| Cart            | ✅ Can use    | ✅ Cannot see own cart |
| Orders          | ✅ Own orders | ✅ All orders          |
| Admin           | ❌ Blocked    | ✅ Full access         |
| User Management | ❌ Blocked    | ✅ Can manage          |
| Reports         | ❌ Blocked    | ✅ Can view            |

**Take Screenshot**: Show denied access message when trying to access admin panel as regular user

---

## ✅ SECURITY CHECK #4: SECURE SESSIONS

### What This Protects

Ensures your session is protected and cannot be hijacked by attackers

### How to Test - Step by Step

#### Step 1: Login to Account

1. Open website and login
2. You should be logged in successfully
3. See your name/email in top right

#### Step 2: Open Browser DevTools

1. Press `F12` on keyboard
2. DevTools window opens at bottom/right
3. Click on "Application" tab (Chrome) or "Storage" tab (Firefox)

#### Step 3: Check Secure Cookie Flags

In DevTools > Application > Cookies:

```
Look for cookie named: "token" or "accessToken"

Verify these properties:
✅ HttpOnly: YES (protects from JavaScript theft)
✅ Secure: YES (only sent over HTTPS in production)
✅ SameSite: Strict (prevents CSRF attacks)
✅ Path: /
✅ Value: Long string starting with "eyJ..." (this is JWT token)
```

**Take Screenshot**: Show cookie properties in DevTools

#### Step 4: Check Session Duration

```
Expected: Session lasts 7 days
Test: Logout button available
Test: Closing browser doesn't logout immediately
Test: Session persists when returning next day
```

#### Step 5: Test Logout

1. Click "Logout" button
2. Redirected to home/login page
3. In DevTools > Cookies: The token cookie should be deleted/cleared

**Take Screenshot**: Show cookie removed after logout

#### Step 6: Check Multi-Device Tracking (Optional)

```
If available in user settings:
- Login on Device 1: Browser shows logged in
- Login on Device 2: Both devices show active sessions
- Logout on Device 1: Only that device logs out
- Device 2 still logged in: Confirms multi-device support
```

---

## ✅ SECURITY CHECK #5: DATA ENCRYPTION

### What This Protects

Sensitive information (phone, address, passwords) is encrypted in the database

### How to Test - Step by Step

#### Step 1: View Your Profile

1. Login to your account
2. Click "Profile" or "My Account"
3. See your information displayed (name, email, phone, address)

#### Step 2: Update Your Profile with Sensitive Data

```
Name: John Doe
Email: john@example.com
Phone: +977-9841234567
Address: Kathmandu, Nepal
```

1. Fill in phone and address
2. Click "Save" or "Update Profile"
3. Should see success message: "Profile updated successfully"

#### Step 3: Check Data in Browser (Encrypted in Transit)

1. Open DevTools (F12)
2. Click "Network" tab
3. Perform profile update again
4. Find the API request (usually POST /api/users/profile)
5. Click on it and see the request data

```
Expected:
- In browser network tab: Phone and address shown plaintext
- Reason: They're encrypted on the server before storing
```

#### Step 4: Check Data in Database (This is Encrypted!)

**This requires MongoDB access:**

1. Open MongoDB Atlas or local MongoDB
2. Go to database: `luxaro_db`
3. Go to collection: `users`
4. Find your user document
5. Look at the "phone" field

```
Expected Result:
❌ NOT plaintext: "+977-9841234567"
✅ ENCRYPTED format: "a1b2c3d4:e5f6g7h8:i9j0k1l2m3n4o5p6..."

This format means:
- First part: Initialization vector (IV)
- Second part: Authentication tag
- Third part: Encrypted data
```

**Take Screenshot**: Show encrypted phone field in MongoDB

#### Step 5: Verify Password Encryption

In MongoDB, look at the "password" field:

```
❌ NOT plaintext password: "TestSecure@123"
✅ HASHED format: "$2b$10$n52Sm.Gx4ylMpUxlXLrNLO..."

This is bcrypt hash - cannot be decrypted, only verified
```

**Take Screenshot**: Show hashed password in MongoDB

---

## ✅ SECURITY CHECK #6: AUDIT LOGGING

### What This Protects

Records all important actions so security team can track suspicious activity

### How to Test - Step by Step

#### Step 1: Perform Various Actions

1. Register a new account
2. Login successfully
3. Try login with wrong password (failed attempt)
4. Update your profile
5. Add item to cart
6. Place an order
7. Logout

#### Step 2: Check Backend Logs

Open terminal where backend is running:

```
You should see logs like:
[2026-01-23 10:30:45] INFO: User registered - email: newuser@example.com
[2026-01-23 10:31:10] INFO: User login - email: newuser@example.com, IP: 127.0.0.1
[2026-01-23 10:31:25] WARN: Failed login attempt - email: newuser@example.com
[2026-01-23 10:32:00] INFO: Profile updated - userId: 12345
[2026-01-23 10:32:30] INFO: Item added to cart - userId: 12345
[2026-01-23 10:33:00] INFO: Order placed - orderId: ORD-001
[2026-01-23 10:33:15] INFO: User logout - email: newuser@example.com
```

**Take Screenshot**: Show backend logs with action records

#### Step 3: Check MongoDB Audit Logs (Optional)

In MongoDB:

1. Go to collection: `auditlogs`
2. You should see documents for each action

```
Example Document:
{
  "_id": ObjectId(...),
  "eventType": "USER_LOGIN",
  "userId": ObjectId(...),
  "email": "newuser@example.com",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": ISODate("2026-01-23T10:31:10.000Z"),
  "status": "success",
  "details": {
    "loginMethod": "email"
  }
}
```

**Take Screenshot**: Show audit log entry in MongoDB

#### Step 4: Try Suspicious Activity and Check Logs

```
Action 1: Try logging in with wrong password 5 times
Expected Log:
[WARN] LOGIN_FAILED - Multiple failed attempts detected
[WARN] ACCOUNT_LOCKED - User account locked after 5 attempts

Action 2: Try accessing admin page as regular user
Expected Log:
[WARN] UNAUTHORIZED_ACCESS - User attempted admin access
```

**Take Screenshot**: Show warning logs for suspicious activity

---

## ✅ SECURITY CHECK #7: XSS (Cross-Site Scripting) PREVENTION

### What This Protects

Prevents attackers from injecting malicious JavaScript code into the website

### How to Test - Step by Step

#### Step 1: Go to a Text Input Field

Examples:

- Product review text area
- Comment field
- Product name (if admin)
- Profile bio

#### Step 2: Try Entering Script Tags (Should NOT Execute!)

```
Try typing: <script>alert('XSS Attack')</script>
Click: Submit / Save
```

**Expected Results:**

```
❌ NO popup alert appears (good!)
✅ Text is saved as plain text
✅ When you view it later, shows: "<script>alert('XSS Attack')</script>"
✅ The script tags are NOT executed
```

#### Step 3: Try Other XSS Payloads (Should All Fail)

Test these different XSS attempts:

**Attempt 1: onload handler**

```
Input: <img src=x onerror="alert('XSS')">
Expected: Text saved as-is, NO popup alert
```

**Attempt 2: onclick handler**

```
Input: <button onclick="alert('XSS')">Click me</button>
Expected: Shows as text, button NOT clickable
```

**Attempt 3: Style with JavaScript**

```
Input: <div style="background:url('javascript:alert(1)')"></div>
Expected: Rendered as text, NO alert
```

**Attempt 4: Event attributes stripped**

```
Input: <svg onload=alert('XSS')>
Expected: SVG tag removed or sanitized
```

#### Step 4: Check Page Source

1. Open DevTools (F12)
2. Go to "Elements" or "Inspector" tab
3. Find where your text is displayed
4. Look at the HTML code

```
Expected:
NOT: <script>alert('XSS')</script>
CORRECT: &lt;script&gt;alert('XSS')&lt;/script&gt;

OR simply: "<script>alert('XSS')</script>" as text

The HTML special characters are escaped:
- < becomes &lt;
- > becomes &gt;
This prevents script execution
```

**Take Screenshot**: Show escaped HTML in page source

---

## ✅ SECURITY CHECK #8: CSRF (Cross-Site Request Forgery) PROTECTION

### What This Protects

Prevents attackers from making requests on your behalf from another website

### How to Test - Step by Step

#### Step 1: Login to Website

1. Open `http://localhost:5173`
2. Login with your account
3. You're now in an active session

#### Step 2: Check for CSRF Token in Network Tab

1. Open DevTools (F12)
2. Click "Network" tab
3. Perform an action that modifies data (e.g., update profile, add to cart)
4. Find the POST request
5. Click on it and go to "Request" tab

```
Look for headers containing:
✅ "X-CSRF-Token" header
OR
✅ "_csrf" field in form data
OR
✅ "csrf" token in request body

Value should be: Long random string like "abc123xyz789..."
```

**Take Screenshot**: Show CSRF token in network request

#### Step 3: Try Request Without Token

**This is advanced - requires curl command:**

```
Open terminal and try:
curl -X POST http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{"bio":"Hacker"}' \
  -H "Cookie: token=YOUR_TOKEN_HERE"

Expected Result:
❌ CSRF token validation failed
❌ 403 Forbidden error
❌ Action NOT performed
```

#### Step 4: Token Expiry

```
Expected: CSRF token expires after 1 hour
Test: Keep page open for 1 hour, then try to submit form
Result: Should ask to refresh page or generate new token
```

**Take Screenshot**: Show form requiring new CSRF token

---

## ✅ SECURITY CHECK #9: SECURITY HEADERS

### What This Protects

Tells browser how to handle security - prevents clickjacking, MIME type attacks, etc.

### How to Test - Step by Step

#### Step 1: Open DevTools Network Tab

1. Press F12
2. Go to "Network" tab
3. Refresh the page
4. Find first request (usually the page itself)
5. Click on "Response Headers" or "Headers"

#### Step 2: Look for Security Headers

Scroll through headers and look for these:

```
✅ Content-Security-Policy: "default-src 'self'..."
   Purpose: Prevents inline scripts and external script loading

✅ X-Frame-Options: "DENY"
   Purpose: Prevents clickjacking attacks

✅ X-Content-Type-Options: "nosniff"
   Purpose: Prevents MIME type sniffing

✅ Referrer-Policy: "strict-origin-when-cross-origin"
   Purpose: Controls referrer information

✅ Strict-Transport-Security: "max-age=31536000"
   Purpose: Forces HTTPS (in production)

✅ X-XSS-Protection: "1; mode=block"
   Purpose: Browser XSS protection (legacy)
```

**Take Screenshot**: Show security headers in DevTools

#### Step 3: Test X-Frame-Options

Try to embed website in an iframe on another domain:

**Create test HTML file:**

```html
<!DOCTYPE html>
<html>
  <body>
    <iframe src="http://localhost:5173/"></iframe>
  </body>
</html>
```

**Expected Result:**

```
❌ Website NOT loaded in iframe
✅ Console shows error like:
   "Refused to frame 'http://localhost:5173'
    because it violates the X-Frame-Options: DENY"
```

#### Step 4: Check Content-Security-Policy

Try to inject inline script:

**In browser console, try:**

```javascript
// This will fail due to CSP
var script = document.createElement("script");
script.textContent = 'alert("Inline script")';
document.head.appendChild(script);
```

**Expected Result:**

```
❌ Script NOT executed
✅ Console shows CSP violation warning:
   "Refused to execute inline script because
    it violates the Content-Security-Policy"
```

**Take Screenshot**: Show CSP violation in console

---

## 📊 SECURITY VERIFICATION SUMMARY TABLE

Print this and check off as you test each feature:

| #   | Security Feature  | Test Status | Screenshot | Working? |
| --- | ----------------- | ----------- | ---------- | -------- |
| 1   | Password Strength | [ ]         | [ ] Taken  | ✅/❌    |
| 2   | Brute Force       | [ ]         | [ ] Taken  | ✅/❌    |
| 3   | RBAC              | [ ]         | [ ] Taken  | ✅/❌    |
| 4   | Secure Sessions   | [ ]         | [ ] Taken  | ✅/❌    |
| 5   | Encryption        | [ ]         | [ ] Taken  | ✅/❌    |
| 6   | Audit Logging     | [ ]         | [ ] Taken  | ✅/❌    |
| 7   | XSS Prevention    | [ ]         | [ ] Taken  | ✅/❌    |
| 8   | CSRF Protection   | [ ]         | [ ] Taken  | ✅/❌    |
| 9   | Security Headers  | [ ]         | [ ] Taken  | ✅/❌    |

---

## 🎯 TROUBLESHOOTING - If Security Features Not Working

### Password Security Not Working

**Problem**: Can set weak passwords like "a"

```
Solution:
1. Check backend is running: npm run dev
2. Check passwordValidator.js exists in backend/utils/
3. Check authController.js validates password on registration
4. Check browser console for errors (F12 > Console)
```

### Brute Force Not Working

**Problem**: Can try unlimited login attempts

```
Solution:
1. Check backend still running
2. Clear browser cookies and cache
3. Check MongoDB connection
4. Look for error in backend terminal
5. Check advancedSecurity.js middleware is applied in server.js
```

### RBAC Not Working

**Problem**: Regular user can access admin page

```
Solution:
1. Check auth.js authorize middleware
2. Check your user role in MongoDB
3. Check routes are protected with authorize('admin')
4. Verify JWT token is valid
```

### Sessions Not Persisting

**Problem**: Get logged out immediately after login

```
Solution:
1. Check MongoDB Session collection
2. Check cookies in DevTools
3. Check JWT_SECRET in .env is set
4. Check server.js has cookie configuration
5. Restart backend: npm run dev
```

### Encryption Not Working

**Problem**: Phone number not encrypted in database

```
Solution:
1. Check encryption.js exists
2. Check ENCRYPTION_KEY is set in .env
3. Check User.js has getter/setter for phone field
4. Update user profile to re-save phone
5. Check MongoDB for encrypted value
```

### Audit Logs Not Recording

**Problem**: No logs appearing in MongoDB

```
Solution:
1. Check AuditLog model exists
2. Check advancedSecurity.js is logging
3. Check MongoDB AuditLog collection
4. Check backend terminal for any errors
5. Perform action again and check MongoDB
```

### XSS Not Being Prevented

**Problem**: Script tags execute in browser

```
Solution:
1. Check advancedSecurity.js sanitization
2. Check express-mongo-sanitize in package.json
3. Check sanitize middleware is applied
4. Try different XSS payloads
5. Check browser console for security errors
```

### CSRF Not Working

**Problem**: Can make requests without CSRF token

```
Solution:
1. Check csrf.js middleware exists
2. Check CSRF middleware applied in server.js
3. Check csrf token in request headers
4. Verify token format in network tab
5. Check MongoDB for token storage
```

---

## 📸 RECOMMENDED SCREENSHOTS TO TAKE

For your final report, take screenshots of:

1. ✅ Password strength meter - weak, medium, strong
2. ✅ Account locked after 5 attempts message
3. ✅ "Unauthorized" or "403 Forbidden" when accessing admin as user
4. ✅ Browser DevTools showing HttpOnly cookie
5. ✅ MongoDB showing encrypted phone field
6. ✅ Backend terminal showing audit log entry
7. ✅ Script tag shown as text (not executed)
8. ✅ CSRF token in network request header
9. ✅ Security headers in DevTools Response Headers
10. ✅ CSP violation message in console

---

## 🎬 VIDEO EVIDENCE

Record these actions:

1. **Password Security**: Show typing weak passwords and seeing errors, then strong password being accepted
2. **Brute Force**: Show 5 failed login attempts and account getting locked
3. **RBAC**: Show logging in as user, being denied admin access
4. **Sessions**: Show DevTools cookies with security flags
5. **Encryption**: Show data in MongoDB encrypted
6. **Audit Logs**: Show backend logs recording actions
7. **XSS**: Show script tags being sanitized to text
8. **CSRF**: Show network request with token
9. **Headers**: Show security headers in DevTools

---

## ✅ FINAL CHECKLIST

- [ ] Tested all 9 security features
- [ ] Took screenshots of each
- [ ] Recorded video demonstrations
- [ ] Documented any issues found
- [ ] Verified all features working
- [ ] Updated documentation
- [ ] Committed to GitHub
- [ ] Ready for submission

---

**Status**: VERIFICATION GUIDE COMPLETE ✅

Use this guide to verify every security feature is working in your website!
