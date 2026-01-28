# 📡 API Documentation - Luxaro

Complete REST API documentation with request/response examples.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT token in cookie or Authorization header:

```bash
# Method 1: Cookie (Automatic)
curl http://localhost:5000/api/users/profile

# Method 2: Bearer Token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users/profile
```

---

## Authentication Endpoints

### 1. Register User

Create a new user account.

```bash
POST /auth/register
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@#",
  "name": "John Doe",
  "phone": "9841234567"
}
```

**Password Requirements:**

- Minimum 12 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

**Response (201 Created):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user",
      "isEmailVerified": false
    }
  }
}
```

---

### 2. Login

Authenticate user and receive JWT token.

```bash
POST /auth/login
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@#"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**After 5 Failed Attempts (423):**

```json
{
  "success": false,
  "message": "Account locked due to multiple failed attempts. Try again in 30 minute(s)."
}
```

---

### 3. Logout

End user session and invalidate token.

```bash
POST /auth/logout
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Get CSRF Token

Get token for form submissions (security).

```bash
GET /csrf-token
```

**Response (200 OK):**

```json
{
  "success": true,
  "token": "3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c"
}
```

---

### 5. Verify Email

Verify email with token from registration email.

```bash
POST /auth/verify-email
```

**Request:**

```json
{
  "token": "email-verification-token-from-email"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 6. Forgot Password

Request password reset email.

```bash
POST /auth/forgot-password
```

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

## Product Endpoints

### 1. Get All Products

Retrieve paginated list of products.

```bash
GET /products?page=1&limit=10&category=Watches&search=luxury
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `search` (optional): Search by name/description
- `sortBy` (optional): Sort field (price, name, createdAt)
- `order` (optional): asc or desc

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Luxury Watch",
      "description": "Premium Swiss Watch",
      "category": "Watches",
      "price": 2999.99,
      "image": "watch.jpg",
      "stock": 50,
      "rating": 4.5,
      "reviews": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

---

### 2. Get Product Details

Get single product with full information.

```bash
GET /products/{productId}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Luxury Watch",
    "description": "Premium Swiss Watch with gold plating",
    "category": "Watches",
    "price": 2999.99,
    "discountPrice": 2499.99,
    "image": "watch.jpg",
    "images": ["watch1.jpg", "watch2.jpg"],
    "stock": 50,
    "rating": 4.5,
    "reviews": [
      {
        "userId": "507f1f77bcf86cd799439010",
        "rating": 5,
        "comment": "Excellent watch!",
        "date": "2026-01-20T10:00:00Z"
      }
    ],
    "specifications": {
      "material": "Gold Plated",
      "warranty": "2 years"
    }
  }
}
```

---

### 3. Create Product (Admin Only)

Create new product.

```bash
POST /products
Authorization: Bearer {admin_token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "name": "Luxury Ring",
  "description": "Diamond engagement ring",
  "category": "Jewelry",
  "price": 5999.99,
  "image": "ring.jpg",
  "stock": 25,
  "specifications": {
    "material": "14K Gold",
    "diamond": "1 Carat"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Luxury Ring",
    "price": 5999.99,
    "category": "Jewelry",
    "stock": 25
  }
}
```

---

### 4. Update Product (Admin Only)

Update product information.

```bash
PUT /products/{productId}
Authorization: Bearer {admin_token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "price": 5499.99,
  "stock": 20,
  "description": "Updated description"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "price": 5499.99,
    "stock": 20
  }
}
```

---

### 5. Delete Product (Admin Only)

Delete product from catalog.

```bash
DELETE /products/{productId}
Authorization: Bearer {admin_token}
X-CSRF-Token: {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Cart Endpoints

### 1. Get Cart

Get current user's shopping cart.

```bash
GET /cart
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439014",
        "productId": "507f1f77bcf86cd799439012",
        "productName": "Luxury Watch",
        "price": 2999.99,
        "quantity": 1,
        "subtotal": 2999.99
      }
    ],
    "subtotal": 2999.99,
    "tax": 449.99,
    "shipping": 100,
    "total": 3549.98
  }
}
```

---

### 2. Add to Cart

Add product to shopping cart.

```bash
POST /cart
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cartId": "507f1f77bcf86cd799439015",
    "total": 5999.98
  }
}
```

---

### 3. Update Cart Item

Update quantity of cart item.

```bash
PUT /cart/{cartItemId}
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "quantity": 3
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "quantity": 3,
    "subtotal": 8999.97
  }
}
```

---

### 4. Remove from Cart

Remove item from shopping cart.

```bash
DELETE /cart/{cartItemId}
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### 5. Clear Cart

Remove all items from cart.

```bash
DELETE /cart
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Order Endpoints

### 1. Create Order

Create order from cart items.

```bash
POST /orders
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 1,
      "price": 2999.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Kathmandu",
    "state": "Bagmati",
    "zipCode": "44600",
    "country": "Nepal"
  },
  "shippingMethod": "standard",
  "couponCode": "LUXARO10"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439016",
    "status": "pending",
    "subtotal": 2999.99,
    "tax": 449.99,
    "shipping": 100,
    "discount": 300,
    "total": 3249.98,
    "createdAt": "2026-01-23T20:00:00Z"
  }
}
```

---

### 2. Get My Orders

Get current user's orders.

```bash
GET /orders
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439016",
      "status": "delivered",
      "total": 3249.98,
      "items": 1,
      "createdAt": "2026-01-23T20:00:00Z",
      "updatedAt": "2026-01-25T10:00:00Z"
    }
  ]
}
```

---

### 3. Get Order Details

Get specific order information.

```bash
GET /orders/{orderId}
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439016",
    "status": "delivered",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "productName": "Luxury Watch",
        "quantity": 1,
        "price": 2999.99
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Kathmandu",
      "country": "Nepal"
    },
    "trackingNumber": "LUX123456789",
    "subtotal": 2999.99,
    "tax": 449.99,
    "shipping": 100,
    "total": 3549.98,
    "timeline": [
      {
        "status": "confirmed",
        "timestamp": "2026-01-23T20:00:00Z"
      },
      {
        "status": "shipped",
        "timestamp": "2026-01-24T10:00:00Z"
      },
      {
        "status": "delivered",
        "timestamp": "2026-01-25T10:00:00Z"
      }
    ]
  }
}
```

---

### 4. Cancel Order

Cancel pending order.

```bash
DELETE /orders/{orderId}
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## User Endpoints

### 1. Get Profile

Get current user's profile.

```bash
GET /users/profile
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "9841234567",
    "role": "user",
    "isEmailVerified": true,
    "addresses": [
      {
        "id": "507f1f77bcf86cd799439020",
        "type": "home",
        "street": "123 Main St",
        "city": "Kathmandu"
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### 2. Update Profile

Update user profile information.

```bash
PUT /users/profile
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "name": "Jane Doe",
  "phone": "9842345678"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### 3. Change Password

Change user password.

```bash
POST /users/change-password
Authorization: Bearer {token}
X-CSRF-Token: {token}
```

**Request:**

```json
{
  "currentPassword": "OldPass123!@#",
  "newPassword": "NewPass456!@#"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Admin Endpoints

### 1. Get All Users

Get list of all users (Admin only).

```bash
GET /admin/users?page=1&limit=20
Authorization: Bearer {admin_token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

### 2. Get Dashboard Analytics

Get dashboard statistics (Admin only).

```bash
GET /admin/analytics
Authorization: Bearer {admin_token}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalOrders": 500,
    "totalRevenue": 125000,
    "averageOrderValue": 250,
    "ordersThisMonth": 45,
    "revenueThisMonth": 12000,
    "newUsersThisMonth": 8,
    "topProducts": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "name": "Luxury Watch",
        "sales": 45
      }
    ]
  }
}
```

---

### 3. Get Audit Logs

Get security audit logs (Admin only).

```bash
GET /admin/audit-logs?eventType=USER_LOGIN&limit=50&page=1
Authorization: Bearer {admin_token}
```

**Query Parameters:**

- `eventType`: Filter by event type (USER_LOGIN, FAILED_LOGIN, PASSWORD_CHANGED, etc.)
- `limit`: Items per page
- `page`: Page number
- `startDate`: Filter from date
- `endDate`: Filter to date

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439030",
      "eventType": "USER_LOGIN",
      "userId": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-01-23T20:00:00Z",
      "severity": "LOW"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 12 characters"
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "message": "Too many requests. Please slow down.",
  "retryAfter": 60
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

Rate limits are applied per IP address:

- **Unauthenticated**: 20 requests/minute
- **Authenticated**: 100 requests/minute
- **Admin**: 500 requests/minute

Headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1674417600
```

---

## Security Notes

1. **CSRF Protection**: POST/PUT/DELETE requests require `X-CSRF-Token` header
2. **Password**: Never sent in response, only in requests
3. **Rate Limiting**: Prevents brute force attacks
4. **Data Encryption**: Sensitive fields encrypted at rest
5. **HTTPS**: Required in production

---

**Last Updated**: January 2026
