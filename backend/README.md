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

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port number | Yes |
| MONGO_URI | MongoDB connection string | Yes |
| GEMINI_API_KEY | Google Gemini API key | Yes |
| NODE_ENV | Environment mode (development/production) | Yes |

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

## Frontend Integration

### Setting Up Axios

Install Axios in your frontend project:

```bash
npm install axios
```

### Configuration

Create an API configuration file (e.g., `src/api/config.js`):

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### Usage Examples

**Health Check Request**

```javascript
import api from './api/config';

const checkHealth = async () => {
  try {
    const response = await api.get('/');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

**Fetching Data**

```javascript
const fetchSchemes = async () => {
  try {
    const response = await api.get('/api/schemes');
    return response.data;
  } catch (error) {
    console.error('Error fetching schemes:', error);
    throw error;
  }
};
```

**File Upload**

```javascript
const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
```

### CORS Configuration

The backend has CORS enabled by default. For production environments, update the CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

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

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run server in production mode |
| `npm run dev` | Run server with nodemon (auto-restart) |
| `npm test` | Run test suite |

## Dependencies

### Core Dependencies

- express - Web framework for Node.js
- mongoose - MongoDB object modeling
- cors - Cross-Origin Resource Sharing middleware
- dotenv - Environment variable management
- langchain - AI/LLM integration framework
- @langchain/google-genai - Google Gemini AI integration
- @langchain/community - LangChain community integrations
- multer - File upload middleware
- pdf-parse - PDF document parsing
- swagger-jsdoc - Swagger documentation generator
- swagger-ui-express - Swagger UI middleware

### Development Dependencies

- nodemon - Development server with auto-restart

## Troubleshooting

### MongoDB Connection Issues

**Error:** Connection refused or timeout

**Solution:** 

1. Verify MongoDB connection string in `.env`
2. Ensure IP address is whitelisted in MongoDB Atlas
3. Check network connectivity

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**

1. Change PORT value in `.env`
2. Kill existing process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux) or use Task Manager (Windows)

### Missing Environment Variables

**Error:** Cannot read property of undefined

**Solution:**

1. Ensure `.env` file exists in backend directory
2. Verify all required variables are defined
3. Restart the server after updating `.env`

### Gemini API Issues

**Error:** Invalid API key or quota exceeded

**Solution:**

1. Verify GEMINI_API_KEY in `.env`
2. Check API quota in Google Cloud Console
3. Ensure billing is enabled for the project

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -m 'Add feature description'`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue in the GitHub repository.
