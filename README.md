# Lin-San API - URL Shortener

A simple and efficient URL shortener API built with Node.js, Express, and MongoDB Atlas.

## 🚀 Deploy on Vercel

This API is optimized for deployment on Vercel.

### 1. Environment Variables
Set these environment variables in your Vercel dashboard:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/
SHORT_CODE_LENGTH=4
```

### 2. Deploy
1. Connect your GitHub repository to Vercel
2. Add environment variables
3. Deploy!

## 📡 API Endpoints

- `GET /health` - Health check
- `POST /api/v1/links` - Create short URL
- `GET /api/v1/links` - Get all links
- `GET /:shortCode` - Redirect to original URL

## 🧪 Testing

```bash
npm test
```

## 🛠️ Local Development

```bash
npm install
npm run dev
```

## 📁 Project Structure

```
├── main.js              # Application entry point
├── configs/             # Configuration files
├── controllers/         # Route controllers
├── middlewares/         # Express middlewares
├── models/             # MongoDB models
├── routes/             # API routes
├── utils/              # Utility functions
├── validations/        # Input validations
├── tests/              # Test files
└── vercel.json         # Vercel configuration
```