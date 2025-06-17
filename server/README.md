# Web3 Express.js REST API with Wallet Authentication

A REST API built with Express.js, TypeORM, SQLite, and Web3 wallet authentication using ethers.js v6.

## Features

- **Express.js** - Fast, unopinionated web framework
- **TypeORM** - Object-relational mapping with TypeScript support
- **SQLite** - Lightweight, file-based database
- **Web3 Authentication** - Wallet-based authentication using signed messages
- **Ethers.js v6** - Ethereum wallet interaction and signature verification
- **Swagger Documentation** - Interactive API documentation and testing
- **TypeScript** - Type-safe development
- **CORS** enabled for cross-origin requests
- **Helmet** for security headers

## API Documentation

Once the server is running, you can access the interactive Swagger documentation at:
**http://localhost:3000/api-docs**

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response examples
- Schema definitions
- Authentication flow examples

## API Endpoints

### Users & Authentication

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/address/:address` - Get user by wallet address
- `POST /api/users/auth` - Authenticate user with signed message
- `PUT /api/users/:id/status` - Update user status
- `DELETE /api/users/:id` - Delete user

### Health Check

- `GET /api/health` - Server health status

### Documentation

- `GET /api-docs` - Swagger API documentation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. The API will be available at `http://localhost:3000`
4. Access Swagger documentation at `http://localhost:3000/api-docs`

## Web3 Authentication Flow

### 1. Client-side: Sign a message with wallet
```javascript
// Using ethers.js v6 on the frontend
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const message = "Please sign this message to authenticate";
const signature = await signer.signMessage(message);
```

### 2. Send signed message to API
```bash
curl -X POST http://localhost:3000/api/users/auth \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please sign this message to authenticate",
    "signature": "0x..."
  }'
```

### 3. API Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "address": "0x742d35cc6634c0532925a3b8d0c9e3e4c413c123",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "address": "0x742d35Cc6634C0532925a3b8D0C9e3e4c413c123",
    "isNewUser": true
  },
  "message": "Authentication successful"
}
```

## Testing with Swagger

1. Open `http://localhost:3000/api-docs` in your browser
2. Explore the available endpoints
3. Use the "Try it out" feature to test API calls
4. View detailed request/response schemas
5. Test the Web3 authentication flow with sample data

## Example Usage

### Get user by wallet address
```bash
curl http://localhost:3000/api/users/address/0x742d35cc6634c0532925a3b8d0c9e3e4c413c123
```

### Update user status
```bash
curl -X PUT http://localhost:3000/api/users/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

## Project Structure

```
src/
├── config/          # Database and Swagger configuration
├── controllers/     # Request handlers
├── entities/        # TypeORM entities
├── middleware/      # Express middleware
├── routes/          # Route definitions with Swagger docs
└── index.ts         # Application entry point
```

## Database Schema

### Users Table
- `id` - Auto-incrementing primary key
- `address` - Ethereum wallet address (unique, 42 characters)
- `status` - User status (default: "active")
- `createdAt` - Timestamp when user was created
- `updatedAt` - Timestamp when user was last updated

## Security Features

- Signature verification using ethers.js
- Address normalization (lowercase)
- Input validation for messages and signatures
- CORS and Helmet security middleware
- Proper error handling

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server