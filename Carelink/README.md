# 🛡️ Luxaro - Enterprise E-Commerce Platform with Advanced Security

![Luxaro Badge](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Security Badge](https://img.shields.io/badge/Security-Enterprise--Grade-green.svg)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Luxaro is a **production-grade e-commerce platform** built with the MERN stack (MongoDB, Express.js, React, Node.js) with **comprehensive security implementation** compliant with OWASP Top 10 and PortSwigger guidelines.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation Guide](#-installation-guide)
- [Environment Configuration](#-environment-configuration)
- [Security Features](#-security-features)
- [Development Guide](#-development-guide)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 Features

### E-Commerce Core

- ✅ **Product Catalog**: Browse, search, and filter luxury products
- ✅ **Shopping Cart**: Add/remove items with real-time updates
- ✅ **Order Management**: Track orders from checkout to delivery
- ✅ **Payment Integration**: eSewa payment gateway integration
- ✅ **User Profiles**: Manage addresses, wishlists, and preferences
- ✅ **Admin Dashboard**: Complete store management interface
- ✅ **Category Management**: Organize products by categories
- ✅ **Coupon System**: Create and apply discount codes

### 🔐 Security Features (Enterprise-Grade)

#### Authentication & Authorization

- **Role-Based Access Control (RBAC)**: User, Admin, Vendor roles
- **JWT Authentication**: Secure token-based authentication
- **Multi-Factor Authentication (MFA)**: Email verification + TOTP (2FA)
- **Session Management**: Multi-device session tracking
- **Automatic Logout**: Session timeout after 7 days

#### Password Security

- **12-Character Minimum**: Enforced strong passwords
- **Complexity Requirements**: Uppercase, lowercase, numbers, symbols
- **Password Strength Meter**: Real-time validation feedback
- **Password History**: Prevent reuse of last 3 passwords
- **Password Expiry**: Automatic expiry every 60 days
- **Common Password Detection**: Prevent dictionary attacks
- **Brute Force Protection**: Account lockout after 5 failed attempts

#### Attack Prevention

- **CSRF Protection**: Cross-Site Request Forgery tokens
- **XSS Prevention**: Input sanitization & output encoding
- **SQL/NoSQL Injection**: Query parameterization & sanitization
- **Rate Limiting**: Per-IP and per-user rate limits
- **DDOS Protection**: Progressive delays and IP blocking
- **Google reCAPTCHA v3**: Bot detection on sensitive endpoints
- **Header Injection Prevention**: Host header validation
- **File Upload Security**: Type validation, size limits, path traversal prevention

#### Data Protection

- **End-to-End Encryption**: AES-256-GCM encryption
- **Password Hashing**: bcrypt with 10 rounds
- **Sensitive Field Encryption**: Phone, address encrypted in database
- **HTTPS/TLS**: Secure data in transit
- **Secure Cookies**: HttpOnly, Secure, SameSite flags

#### Audit & Logging

- **Comprehensive Audit Logs**: All user actions logged
- **Security Event Tracking**: Failed logins, unauthorized access
- **IP Address Tracking**: Geographic and behavioral analysis
- **User Agent Logging**: Device fingerprinting
- **Admin Action Audit**: Track administrative changes

#### Security Headers

- **Helmet.js**: Industry-standard security headers
- **HSTS**: Force HTTPS connection
- **CSP**: Content Security Policy with nonce
- **X-Frame-Options**: Clickjacking prevention
- **X-Content-Type-Options**: MIME type sniffing prevention

---

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js ≥ 18.0.0
- **Framework**: Express.js 4.18
- **Database**: MongoDB 5.0+
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, express-mongo-sanitize
- **Encryption**: crypto (AES-256-GCM), bcryptjs
- **Email**: Nodemailer with SMTP
- **File Handling**: Multer with Sharp for image processing
- **Logging**: Winston logger
- **Task Queue**: Built-in in-memory + MongoDB

### Frontend

- **Framework**: React 18 with Vite
- **Build Tool**: Vite 5.0
- **HTTP Client**: Axios
- **State Management**: React Context API
- **UI Components**: Custom CSS
- **Authentication**: JWT tokens in secure cookies
- **Security**: React built-in XSS prevention

### Development Tools

- **Package Manager**: npm
- **Development Server**: Nodemon
- **Code Quality**: ESLint recommended
- **Testing**: Jest + Supertest
- **Database Admin**: MongoDB Compass (recommended)

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB running locally or MongoDB Atlas account
- Git installed
- Gmail account with App Password (for email)

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/luxaro.git
cd luxaro

# 2. Install dependencies (root + backend + frontend)
npm run install-all

# 3. Create backend .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your configurations

# 4. Create frontend .env file (if needed)
cp frontend/.env.example frontend/.env

# 5. Start MongoDB (ensure it's running)
# On Windows: mongod
# On Mac/Linux: brew services start mongodb-community

# 6. Run development server
npm run dev

# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

---

## 📖 Installation Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/luxaro.git
cd luxaro
```

### Step 2: Install Dependencies

**Backend Installation**

```bash
cd backend
npm install
cd ..
```

**Frontend Installation**

```bash
cd frontend
npm install
cd ..
```

**Or install all at once:**

```bash
npm run install-all
```

### Step 3: MongoDB Setup

#### Option A: Local MongoDB

```bash
# Windows (if installed)
mongod

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

Verify: `mongo --version`

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Get connection string
5. Update `MONGODB_URI` in `.env`

### Step 4: Environment Configuration

```bash
# Copy the example env file
cp backend/.env.example backend/.env

# Edit with your values
nano backend/.env
# or
code backend/.env  # If using VS Code
```

See [Environment Configuration](#-environment-configuration) section for details.

### Step 5: Start Services

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run server    # Terminal 1: Backend on port 5000
npm run client    # Terminal 2: Frontend on port 5173
```

### Step 6: Verify Installation

- **Backend**: Open http://localhost:5000
- **Frontend**: Open http://localhost:5173
- **API Health**: http://localhost:5000/api/health

---

## 🔧 Environment Configuration

### Backend .env Setup

Create `backend/.env` file with these variables:

```dotenv
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/luxaro

# JWT (Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=cd10edb9b247046dd3db7c7bb736e44966822f2ba83caff7779f9786c98f6cede8ae64ef40cd797ce369df385fcd75690411198d1465a3d0d6d1dcec4b66708f
JWT_EXPIRE=7d

# Encryption (Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=c662dee9c1b11cd08f024eed4dc1b1cde63916ac3804084d04a592a1e22ef366

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google reCAPTCHA v3
GOOGLE_RECAPTCHA_SITE_KEY=your_site_key
GOOGLE_RECAPTCHA_SECRET_KEY=your_secret_key

# eSewa Payment
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q@
ESEWA_API_URL=https://uat.esewa.com.np/api/epay/main/v2/form
ESEWA_SUCCESS_URL=http://localhost:5173/payment-success
ESEWA_FAILURE_URL=http://localhost:5173/payment-failure

# Security Settings
PASSWORD_MIN_LENGTH=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
PASSWORD_EXPIRY_DAYS=60
SESSION_DURATION=604800000
```

### Frontend .env Setup (Optional)

```bash
cp frontend/.env.example frontend/.env
```

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=your_site_key
```

### Secret Generation

Generate strong secrets using Node.js:

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 Security Features

For detailed security implementation documentation, see [SECURITY.md](./SECURITY.md).

### Quick Security Overview

#### 1. **Password Security**

- 12-character minimum with complexity requirements
- bcrypt hashing with 10 rounds
- Password strength meter with real-time feedback
- Password expiry every 60 days

#### 2. **Brute Force Prevention**

- Account lockout after 5 failed login attempts
- 30-minute lockout duration
- IP-based rate limiting
- Google reCAPTCHA v3 integration

#### 3. **Role-Based Access Control**

- Three roles: User, Admin, Vendor
- Permission-based route protection
- Data isolation between users
- Admin-only endpoints

#### 4. **Session Management**

- JWT tokens with 7-day expiry
- Secure cookies (HttpOnly, Secure, SameSite)
- Multi-device session tracking
- Automatic session termination

#### 5. **Data Encryption**

- AES-256-GCM for sensitive fields
- Password hashing with bcrypt
- HTTPS/TLS for data in transit
- No plaintext storage

#### 6. **Audit Logging**

- All user actions logged
- Timestamps, IP addresses, user agents
- Failed login attempts tracked
- Admin actions audited

---

## 💻 Development Guide

### Project Structure

```
luxaro/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Security & auth middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── logs/            # Log files
│   ├── uploads/         # User uploads
│   ├── server.js        # Entry point
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context
│   │   ├── services/    # API calls
│   │   └── App.jsx      # Root component
│   └── index.html       # HTML entry point
├── README.md            # This file
├── SECURITY.md          # Security documentation
├── TESTING.md           # Testing guide
└── INSTALLATION.md      # Installation steps
```

### Running in Development

**Terminal 1 - Backend:**

```bash
npm run server
# Runs with nodemon (auto-restart on changes)
# Available at: http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
npm run client
# Runs Vite dev server with HMR
# Available at: http://localhost:5173
```

### Available npm Scripts

```bash
npm run dev              # Run both backend and frontend
npm run server           # Run backend only
npm run client           # Run frontend only
npm run start            # Production server start
npm run build            # Build frontend for production
npm run test             # Run all tests
npm run test:security    # Run security tests
npm run install-all      # Install all dependencies
```

### Code Standards

- **Node.js**: Use async/await, not callbacks
- **Express**: Use middleware for cross-cutting concerns
- **MongoDB**: Use models for all database operations
- **React**: Use functional components with hooks
- **Security**: Validate & sanitize all user input

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Core Endpoints

#### Authentication

```
POST   /auth/register          # Register new user
POST   /auth/login             # Login user
POST   /auth/logout            # Logout user
POST   /auth/refresh-token     # Refresh JWT token
POST   /auth/forgot-password   # Reset password
POST   /auth/verify-email      # Verify email
```

#### Products

```
GET    /products               # List all products
GET    /products/:id           # Get product details
POST   /products               # Create product (admin)
PUT    /products/:id           # Update product (admin)
DELETE /products/:id           # Delete product (admin)
```

#### Orders

```
POST   /orders                 # Create order
GET    /orders                 # Get user orders
GET    /orders/:id             # Get order details
PUT    /orders/:id             # Update order (admin)
DELETE /orders/:id             # Cancel order
```

#### Users (Admin)

```
GET    /users                  # List all users (admin)
GET    /users/:id              # Get user details
PUT    /users/:id              # Update user
DELETE /users/:id              # Delete user
```

### Full API Documentation

See [API.md](./API.md) for complete endpoint documentation with request/response examples.

---

## 🧪 Testing

### Manual Testing

For comprehensive manual testing guide, see [TESTING.md](./TESTING.md).

### Automated Tests

Run security-focused tests:

```bash
npm test                # Run all tests
npm run test:security   # Run security tests only
npm run test:features   # Test all features
```

### Using Postman

1. Import the Postman collection: `postman-collection.json`
2. Set environment variables
3. Run test suites for each endpoint

Collection file location: `docs/postman-collection.json`

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:

```bash
# Check if MongoDB is running
mongod

# Or start MongoDB service
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port Already in Use

**Error**: `listen EADDRINUSE: address already in use :::5000`

**Solution**:

```bash
# Find and kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### Dependencies Installation Failed

**Error**: `npm ERR! ERR! code ERESOLVE`

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps flag
npm install --legacy-peer-deps
```

### Frontend Not Loading

**Error**: `Cannot GET /`

**Solution**:

1. Ensure frontend is running: `npm run client`
2. Check frontend is on http://localhost:5173
3. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

### API CORS Issues

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:

1. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Check backend is running and accepting connections
3. Verify `CORS` middleware is properly configured

### Email Not Sending

**Error**: `Error: Invalid login: 505 5.7.1 Invalid credentials`

**Solution**:

1. Verify Gmail account credentials
2. Use App Password (not regular password) for 2FA-enabled accounts
3. Enable "Less secure apps" if not using App Password
4. Check EMAIL_USER and EMAIL_PASS in `.env`

---

## 📚 Additional Resources

- [SECURITY.md](./SECURITY.md) - Detailed security implementation
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [INSTALLATION.md](./INSTALLATION.md) - Detailed installation steps
- [API.md](./API.md) - Complete API documentation

## 🔗 External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security](https://portswigger.net/web-security)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev)
- [JWT Introduction](https://jwt.io)

---

## 🤝 Contributing

### Reporting Security Issues

**IMPORTANT**: Do NOT open public issues for security vulnerabilities!

1. Email security issues to: security@luxaro.com
2. Include steps to reproduce
3. Avoid disclosing publicly

### Code Contributions

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Follow code standards
4. Write tests for new features
5. Submit pull request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👨‍💼 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered product recommendations
- [ ] Advanced inventory management
- [ ] Multi-vendor support
- [ ] Cryptocurrency payment integration

---

## ⭐ Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📤 Sharing with others

---

**Happy Coding! 🚀**

Last Updated: January 2026

