# Niti-Setu Backend API

Voice-Based Scheme Eligibility Engine - Backend Server for Ajrasakha Hackathon

## Overview

This is the backend server for Niti-Setu, a voice-based scheme eligibility engine built with Node.js and Express. The server handles API requests, manages database operations, and integrates with Google Gemini AI for intelligent query processing.

## Technology Stack

- Node.js - JavaScript runtime environment
- Express.js v5.2.1 - Web application framework
- MongoDB with Mongoose - Database and ODM
- LangChain - AI/LLM framework
- Google Gemini AI - Natural language processing
- Swagger - API documentation

## Prerequisites

- Node.js version 14 or higher
- npm package manager
- MongoDB Atlas account or local MongoDB instance
- Google Gemini API key

## Installation

Navigate to the backend directory:

```bash
cd backend
```

Install all required dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the backend directory by copying the example file:

```bash
cp .ENV_EXAMPLE .env
```

Update the `.env` file with your configuration values:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string_here
GEMINI_API_KEY=your_gemini_key_here
NODE_ENV=development
```


## Running the Application

### Development Mode

Run the server with automatic restart on file changes:

```bash
npm run dev
```

### Production Mode

Run the server in production mode:

```bash
npm start
```

The server will start on `http://localhost:5000`. You will see console output confirming:

- Server running status
- MongoDB connection status
- Swagger documentation URL

## API Documentation

### Interactive Documentation

Access the Swagger UI for interactive API documentation:

```
http://localhost:5000/api-docs
```

### Available Endpoints

**Health Check**

```
GET /
```

Returns a message confirming the API is running.

Response:
```
Niti-Setu API is running...
```

**API Documentation**

```
GET /api-docs
```

Provides interactive Swagger UI interface for testing all endpoints.

## Project Structure

```
backend/
├── config/
│   ├── db.js          # MongoDB connection configuration
│   └── swagger.js     # Swagger API documentation setup
├── models/
│   └── Scheme.js      # Mongoose schema for government schemes
├── .ENV_EXAMPLE       # Environment variables template
├── .gitignore         # Git ignore rules
├── package.json       # Dependencies and scripts
├── server.js          # Application entry point
└── README.md          # Documentation
```

## Database Schema

### Scheme Model

The Scheme model represents government schemes and policies with the following structure:

- **name** - Scheme name (unique, required)
- **benefits** - Benefit details including type, maximum value, and description
- **required_documents** - Array of required documentation
- **original_pdf_url** - Source PDF URL for RAG implementation
- **text_chunks** - Processed text chunks for embeddings
- **filters** - Metadata for state, gender, and caste-based filtering

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -m 'Add feature description'`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.
