# E-Commerce Backend API

A robust e-commerce backend solution built with Node.js, Express, MongoDB, and Redis. This API provides all the necessary functionality for running an online store including product management, user authentication, cart/wishlist management, order processing, and more.

## Features

- **Role-based Authentication**: Three user roles - Super Admin, Admin, and User with appropriate access controls
- **Redis Caching**: Improved performance with Redis-powered caching for authentication and high-traffic routes
- **Product Management**: Full CRUD operations for products with support for categories, subcategories, and festivals
- **User Management**: Registration, login (both email/password and OTP-based), profile management
- **E-commerce Essentials**: Cart, wishlist, order management, promo codes, and reviews
- **API Documentation**: Complete API documentation with Swagger
- **Performance Optimized**: Efficient database queries, pagination, and caching for high performance
- **Security**: JWT-based authentication, input validation, and proper error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- Redis (v6 or higher)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the root directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET_KEY=your_jwt_secret_key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_TTL=3600
   SUPERADMIN_SECRET_KEY=your_superadmin_setup_key
   NODE_ENV=development
   PORT=5000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Initial Setup

### Creating a Super Admin

To create the initial Super Admin (required for further admin management):

```
POST /api/v1/superadmin/setup
```

Body:
```json
{
  "name": "Super Admin",
  "email": "superadmin@example.com",
  "password": "securepassword123",
  "secretKey": "your_superadmin_setup_key" // From .env file
}
```

### API Access

Once set up, you can:

1. Access the API through: `http://localhost:5000/api/v1/`
2. View API documentation through: `http://localhost:5000/api-docs`

## Role-Based Access

The system implements three roles with different permissions:

### Super Admin
- Full system access
- Can create/manage admins
- Can access all data and functionalities

### Admin
- Manage products, categories, orders
- Limited by permissions assigned by Super Admin
- Cannot create/manage other admins

### User
- Browse products
- Manage their cart/wishlist
- Place orders
- Write reviews

## API Structure

- `/api/v1/admin/*` - Admin management endpoints
- `/api/v1/superadmin/*` - SuperAdmin operations
- `/api/v1/user/*` - User management and operations
- `/api/v1/product/*` - Product management
- `/api/v1/category/*` - Category management
- `/api/v1/subcategory/*` - Subcategory management
- `/api/v1/festival/*` - Festival management
- `/api/v1/cart/*` - Shopping cart operations
- `/api/v1/wishlist/*` - Wishlist operations
- `/api/v1/order/*` - Order processing
- `/api/v1/promo/*` - Promo code management
- `/api/v1/review/*` - Product reviews

## Authentication

### User Authentication

#### Email/Password Login:
```
POST /api/v1/user/login/email
```

Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Phone OTP Login:
```
POST /api/v1/user/login/phone
```

Body:
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+1"
}
```

Then verify OTP:
```
POST /api/v1/user/verify-otp
```

Body:
```json
{
  "phoneNumber": "1234567890",
  "countryCode": "+1",
  "otp": "123456"
}
```

### Admin Authentication

```
POST /api/v1/admin/login
```

Body:
```json
{
  "email": "admin@example.com",
  "password": "adminpass123"
}
```

## Development

### Redis Configuration

Redis is used for:
1. Authentication caching
2. Route response caching
3. Frequently accessed data caching

To disable Redis (not recommended for production):
- Keep the Redis configuration in the .env file but Redis will gracefully fail if not available

### Testing

```bash
# Coming soon
npm test
```

## Error Handling

The API provides standardized error responses:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Specific error message"
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 