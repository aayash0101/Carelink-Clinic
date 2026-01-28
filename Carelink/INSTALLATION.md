# 📦 Installation & Setup Guide - Luxaro

Complete step-by-step guide to set up Luxaro locally for development and testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start-5-minutes)
3. [Detailed Installation](#detailed-installation)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v5.0 or higher
- **Git**: Latest version

### Check Your Installation

```bash
# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check Git
git --version
# Expected: git version 2.x.x or higher

# Check MongoDB (if installed locally)
mongod --version
# Expected: db version v5.x or higher
```

### System Requirements

- **RAM**: Minimum 2GB (4GB+ recommended)
- **Disk Space**: 500MB free space
- **OS**: Windows, macOS, or Linux

---

## Quick Start (5 minutes)

If you have all prerequisites installed:

```bash
# 1. Clone repository
git clone https://github.com/yourusername/luxaro.git
cd luxaro

# 2. Install all dependencies
npm run install-all

# 3. Copy and configure .env files
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 4. Ensure MongoDB is running
mongod  # Run in separate terminal

# 5. Start development servers
npm run dev

# Done! Access:
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

---

## Detailed Installation

### Step 1: Install Node.js & npm

#### Windows

1. Download from https://nodejs.org/ (LTS version)
2. Run installer
3. Choose "Add to PATH" during installation
4. Restart terminal

Verify:

```cmd
node --version
npm --version
```

#### macOS (using Homebrew)

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify
node --version
npm --version
```

#### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Verify
node --version
npm --version
```

---

### Step 2: Install Git

#### Windows

1. Download from https://git-scm.com/
2. Run installer
3. Use default settings
4. Restart terminal

#### macOS

```bash
brew install git
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt install git
```

Verify:

```bash
git --version
```

---

### Step 3: Install MongoDB

#### Option A: Local MongoDB Installation

**Windows (using Chocolatey)**

```powershell
choco install mongodb
```

**macOS (using Homebrew)**

```bash
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongod --version
```

**Linux (Ubuntu/Debian)**

```bash
# Add MongoDB repository
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod

# Verify
mongod --version
```

#### Option B: MongoDB Atlas (Cloud) - Recommended for beginners

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new project
4. Create a new cluster (free tier available)
5. Create database user with username/password
6. Get connection string
7. Update `MONGODB_URI` in `.env` file

```dotenv
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luxaro?retryWrites=true&w=majority
```

---

### Step 4: Clone Repository

```bash
# Navigate to desired directory
cd /path/to/projects

# Clone repository
git clone https://github.com/yourusername/luxaro.git
cd luxaro

# Verify structure
ls -la
# Should show: backend/, frontend/, README.md, package.json, etc.
```

---

### Step 5: Install Dependencies

#### Install Root Dependencies

```bash
cd /path/to/luxaro

# Install root level dependencies
npm install
```

#### Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

#### Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

#### Or Install All at Once

```bash
npm run install-all
```

This runs the custom script that installs all dependencies in the correct order.

---

### Step 6: Environment Configuration

#### Create Backend .env File

```bash
# Copy example file
cp backend/.env.example backend/.env

# Edit with your editor
code backend/.env  # VS Code
# or
nano backend/.env  # Nano
# or
vim backend/.env   # Vim
```

#### Essential Configuration

Minimum required values:

```dotenv
# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/luxaro

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=YOUR_RANDOM_SECRET_HERE

# Encryption Key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=YOUR_RANDOM_KEY_HERE

# Email (set up Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password

# reCAPTCHA (get from https://www.google.com/recaptcha/admin)
GOOGLE_RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET
GOOGLE_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY

# eSewa Payment (test credentials - replace with live credentials)
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q@
ESEWA_API_URL=https://uat.esewa.com.np/api/epay/main/v2/form
ESEWA_SUCCESS_URL=http://localhost:5173/payment-success
ESEWA_FAILURE_URL=http://localhost:5173/payment-failure
```

#### Generate Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Setup Gmail App Password

1. Go to https://myaccount.google.com/
2. Enable 2-Factor Authentication
3. Go to App passwords (near bottom)
4. Select "Mail" and "Windows Computer"
5. Copy 16-character password
6. Paste in `EMAIL_PASS` in `.env`

#### Create Frontend .env File (Optional)

```bash
cp frontend/.env.example frontend/.env
```

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY
```

---

## Database Setup

### MongoDB Local Setup

#### Start MongoDB

**Windows (Command Prompt as Administrator):**

```cmd
mongod
```

**macOS/Linux:**

```bash
brew services start mongodb-community
# or
sudo systemctl start mongod
```

#### Create Initial Database

```bash
# Connect to MongoDB
mongo
# or
mongosh

# Switch to luxaro database (creates if doesn't exist)
use luxaro

# Create test collection
db.products.insertOne({name: "Test Product"})

# Verify
db.products.find()

# Exit
exit
```

### MongoDB Atlas Setup

1. Login to https://www.mongodb.com/cloud/atlas
2. Create cluster with free tier
3. Whitelist IP address (or allow all for dev)
4. Create database user
5. Get connection string
6. Update `.env` file with connection string

---

## Verification

### Verify All Systems Working

```bash
# 1. Check Node.js
node --version

# 2. Check npm
npm --version

# 3. Check MongoDB (should connect)
mongosh "mongodb://localhost:27017/luxaro"
# or for Atlas:
mongosh "mongodb+srv://username:password@cluster.mongodb.net/luxaro"

# 4. Check dependencies
cd backend && npm list | head -20
cd ../frontend && npm list | head -20
```

### Start Development Servers

**Terminal 1 - Backend:**

```bash
cd luxaro
npm run server
```

Expected output:

```
✅ Server running on port 5000
✅ MongoDB connected: mongodb://localhost:27017/luxaro
```

**Terminal 2 - Frontend:**

```bash
cd luxaro
npm run client
```

Expected output:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Test in Browser

1. Open http://localhost:5173
2. Register new account
3. Login
4. Browse products
5. Add to cart
6. Checkout

---

## Troubleshooting

### MongoDB Connection Failed

**Error:** `connect ECONNREFUSED 127.0.0.1:27017`

**Solutions:**

1. **Check if MongoDB is running:**

   ```bash
   # macOS
   brew services list | grep mongodb-community

   # Linux
   sudo systemctl status mongod
   ```

2. **Start MongoDB:**

   ```bash
   # Windows
   mongod

   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

3. **Check MongoDB logs:**
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ```

---

### Port Already in Use

**Error:** `listen EADDRINUSE: address already in use :::5000`

**Windows:**

```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**macOS/Linux:**

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Alternative:** Change PORT in `.env` to 5001 or 8000

---

### Dependencies Installation Failed

**Error:** `npm ERR! code ERESOLVE`

**Solutions:**

```bash
# Clear cache
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps

# Or use npm 7+
npm install
```

---

### Environment Variables Not Loading

**Error:** `undefined` values in configuration

**Check:**

1. `.env` file exists in `backend/` directory
2. File has correct permissions: `chmod 644 backend/.env`
3. Restart backend server after editing `.env`
4. Use `require('dotenv').config()` at top of server.js

**Debug:**

```javascript
// In backend/server.js
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("NODE_ENV:", process.env.NODE_ENV);
```

---

### Email Not Sending

**Error:** `Error: Invalid login: 535 5.7.8`

**Solutions:**

1. **Verify Gmail settings:**
   - 2FA must be enabled
   - Use App Password (not regular password)
   - Try: `EMAIL_USER=your-email@gmail.com`

2. **Check credentials:**

   ```bash
   # Test SMTP connection
   telnet smtp.gmail.com 587
   ```

3. **Allow Less Secure Apps:**
   - Go to: https://myaccount.google.com/lesssecureapps
   - Enable for testing

---

### Frontend Not Connecting to Backend

**Error:** `Failed to fetch from http://localhost:5000/api`

**Check:**

1. Backend is running: `npm run server`
2. FRONTEND_URL in backend `.env` matches:
   ```dotenv
   FRONTEND_URL=http://localhost:5173
   ```
3. Browser console for CORS errors
4. Check frontend `.env`:
   ```dotenv
   VITE_API_URL=http://localhost:5000/api
   ```

---

### Git Clone Failed

**Error:** `fatal: unable to access repository`

**Solutions:**

1. **Check internet connection:**

   ```bash
   ping github.com
   ```

2. **Verify GitHub credentials:**

   ```bash
   git config user.name
   git config user.email
   ```

3. **Try HTTPS instead of SSH:**
   ```bash
   git clone https://github.com/username/luxaro.git
   ```

---

### Node Modules Corrupted

**Error:** `Cannot find module` or strange package errors

**Solution:**

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json

# Reinstall
npm install

# For backend and frontend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

1. ✅ Follow [README.md](./README.md) for feature overview
2. ✅ Read [SECURITY.md](./SECURITY.md) for security implementation
3. ✅ Check [TESTING.md](./TESTING.md) for testing procedures
4. ✅ Review [API.md](./API.md) for endpoint documentation

---

## Useful Commands

```bash
# Run development servers
npm run dev

# Run only backend
npm run server

# Run only frontend
npm run client

# Build frontend for production
npm run build

# Run tests
npm test

# Run security tests
npm run test:security

# Check all dependencies
npm ls

# Update all dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix
```

---

**Installation Complete! Ready to develop. 🚀**

For help, check [Troubleshooting](#troubleshooting) or see [README.md](./README.md) FAQ section.
