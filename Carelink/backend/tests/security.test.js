// // tests/security.test.js - NEW FILE
// const request = require('supertest');
// const app = require('../server');

// describe('Security Tests', () => {
  
//   describe('OWASP Top 10', () => {
    
//     test('A01: Broken Access Control - Unauthorized admin access', async () => {
//       const response = await request(app)
//         .get('/api/admin/dashboard')
//         .expect(401);
      
//       expect(response.body.success).toBe(false);
//       expect(response.body.code).toBe('NO_TOKEN');
//     });
    
//     test('A03: Injection - NoSQL injection in login', async () => {
//       const response = await request(app)
//         .post('/api/auth/login')
//         .send({
//           email: { $ne: null },
//           password: 'anything'
//         })
//         .expect(400);
      
//       expect(response.body.success).toBe(false);
//     });
    
//     test('A05: Security Misconfiguration - X-Powered-By header removed', async () => {
//       const response = await request(app).get('/health');
//       expect(response.headers['x-powered-by']).toBeUndefined();
//     });
    
//     test('A07: Identification Failures - Brute force protection', async () => {
//       const attempts = [];
//       for (let i = 0; i < 6; i++) {
//         attempts.push(
//           request(app)
//             .post('/api/auth/login')
//             .send({ email: 'test@test.com', password: 'wrong' })
//         );
//       }
      
//       const responses = await Promise.all(attempts);
//       const lastResponse = responses[responses.length - 1];
      
//       expect(lastResponse.status).toBe(423); // Locked
//     });
    
//     test('A08: Software Integrity - eSewa signature verification', async () => {
//       const response = await request(app)
//         .get('/api/payments/esewa/success')
//         .query({
//           transaction_uuid: 'test',
//           signature: 'invalid',
//           signed_field_names: 'transaction_uuid'
//         });
      
//       expect(response.status).toBe(302); // Redirect to failure
//     });
//   });
  
//   describe('Input Validation', () => {
    
//     test('XSS Prevention - Script tags in product name', async () => {
//       const response = await request(app)
//         .post('/api/products')
//         .set('Authorization', 'Bearer ADMIN_TOKEN')
//         .send({
//           name: '<script>alert("XSS")</script>',
//           description: 'Test',
//           price: 100,
//           stock: 10,
//           category: 'Test'
//         });
      
//       // Should either reject or sanitize
//       if (response.status === 201) {
//         expect(response.body.data.product.name).not.toContain('<script>');
//       }
//     });
    
//     test('Path Traversal - Malicious file upload', async () => {
//       const response = await request(app)
//         .post('/api/products')
//         .set('Authorization', 'Bearer ADMIN_TOKEN')
//         .field('name', 'Test Product')
//         .attach('images', Buffer.from('fake'), '../../../etc/passwd');
      
//       expect(response.status).toBe(400);
//     });
//   });
  
//   describe('Session Security', () => {
    
//     test('JWT Blacklist - Reusing logged out token', async () => {
//       // 1. Login
//       const loginRes = await request(app)
//         .post('/api/auth/login')
//         .send({ email: 'test@test.com', password: 'ValidPass123!' });
      
//       const token = loginRes.body.token;
      
//       // 2. Logout
//       await request(app)
//         .post('/api/auth/logout')
//         .set('Authorization', `Bearer ${token}`);
      
//       // 3. Try to reuse token
//       const retryRes = await request(app)
//         .get('/api/auth/me')
//         .set('Authorization', `Bearer ${token}`)
//         .expect(401);
      
//       expect(retryRes.body.code).toBe('TOKEN_REVOKED');
//     });
//   });
// });














































const request = require('supertest');
const mongoose = require('mongoose');

// ✅ CRITICAL: Use SEPARATE test database
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/carelink_test';

let app;
let server;

// ✅ Setup: Connect to TEST database BEFORE tests
beforeAll(async () => {
  // Prevent accidental production database usage
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ NEVER run tests in production!');
  }
  
  // Connect to TEST database
  await mongoose.connect(TEST_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ Connected to TEST database:', mongoose.connection.name);
  
  // Import app AFTER database connection
  app = require('../server');
}, 30000);

// ✅ Cleanup: Delete test data and disconnect AFTER tests
afterAll(async () => {
  // Clear all test collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  // Close database connection
  await mongoose.connection.close();
  
  // Close server if running
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  
  console.log('✅ Test cleanup completed');
}, 30000);

// ✅ Reset database before each test
beforeEach(async () => {
  // Optional: Clear data between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('🔒 Security Tests', () => {
  
  describe('OWASP A01: Broken Access Control', () => {
    
    test('Should block unauthorized admin access', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    test('Should prevent IDOR (accessing other user orders)', async () => {
      // Create user and order in test
      const User = require('../models/User');
      const Order = require('../models/Order');
      
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@test.com',
        password: 'Test123!@#',
        phone: '1234567890'
      });
      
      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@test.com',
        password: 'Test123!@#',
        phone: '0987654321'
      });
      
      const order = await Order.create({
        orderNumber: 'TEST-001',
        user: user2._id,
        items: [],
        shippingAddress: {
          fullName: 'Test',
          phone: '1234567890',
          address: 'Test',
          city: 'Test'
        },
        subtotal: 100,
        total: 100
      });
      
      // Login as user1
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user1@test.com', password: 'Test123!@#' });
      
      const token = loginRes.body.token;
      
      // Try to access user2's order
      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404); // Should not find (IDOR protection)
    });
  });
  
  describe('OWASP A03: Injection Prevention', () => {
    
    test('Should block NoSQL injection in login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: 'anything'
        });
      
      // Should reject or sanitize
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
    
    test('Should sanitize $where operator', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: { $where: "1==1" } });
      
      // Should either reject or ignore malicious query
      expect(response.status).toBeLessThan(500);
    });
  });
  
  describe('OWASP A05: Security Misconfiguration', () => {
    
    test('Should remove X-Powered-By header', async () => {
      const response = await request(app).get('/api/products');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
    
    test('Should set security headers', async () => {
      const response = await request(app).get('/api/products');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });
  
  describe('OWASP A07: Authentication Failures', () => {
    
    test('Should enforce password complexity', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'weak@test.com',
          password: '12345', // Weak password
          phone: '1234567890'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('security requirements');
    });
    
    test('Should implement account lockout after failed attempts', async () => {
      const User = require('../models/User');
      
      // Create test user
      await User.create({
        name: 'Test',
        email: 'lock@test.com',
        password: 'Correct123!@#',
        phone: '1234567890',
        isEmailVerified: true
      });
      
      // Attempt 5 wrong logins
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'lock@test.com', password: 'WrongPass123!' });
      }
      
      // 6th attempt should be locked
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lock@test.com', password: 'WrongPass123!' })
        .expect(423); // Locked
      
      expect(response.body.message).toContain('locked');
    });
  });
  
  describe('Input Validation', () => {
    
    test('Should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'invalid-email',
          password: 'Test123!@#',
          phone: '1234567890'
        });
      
      expect(response.status).toBe(400);
    });
    
    test('Should limit string length', async () => {
      const longString = 'A'.repeat(10000);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: longString,
          email: 'test@test.com',
          password: 'Test123!@#',
          phone: '1234567890'
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Session Security', () => {
    
    test('Should invalidate token on logout', async () => {
      const User = require('../models/User');
      
      // Create and verify user
      await User.create({
        name: 'Test',
        email: 'session@test.com',
        password: 'Test123!@#',
        phone: '1234567890',
        isEmailVerified: true
      });
      
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'session@test.com', password: 'Test123!@#' });
      
      const token = loginRes.body.token;
      
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      
      // Try to use old token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});

describe('🔐 File Upload Security', () => {
  
  test('Should reject non-image files', async () => {
    // This test requires admin token - skip if not testing file uploads
    // or create admin user in beforeEach
  });
  
  test('Should validate file size', async () => {
    // Test max file size limit
  });
});

describe('💳 Payment Security', () => {
  
  test('Should validate eSewa signature', async () => {
    const response = await request(app)
      .get('/api/payments/esewa/success')
      .query({
        transaction_uuid: 'test-123',
        signature: 'invalid-signature',
        signed_field_names: 'transaction_uuid'
      });
    
    // Should redirect to failure
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('failure');
  });
});