# Niti-Setu (नीति-सेतु)

**Bureaucracy to Benefits in Seconds.**

Niti-Setu is an AI-powered platform designed to empower Indian citizens, especially farmers, by simplifying the discovery and eligibility verification of government schemes. By leveraging Retrieval-Augmented Generation (RAG) and Voice-to-Profile technology, Niti-Setu breaks down complex 50-page policy documents into instant, personalized Yes/No decisions with official citations.

## Key Features

-   **AI Semantic Search:** Search for schemes using natural language (e.g., "Financial help for building a house") rather than rigid keywords.
-   **RAG-based Chat Assistant:** Interact with an AI expert that reads official PDF guidelines to answer your specific questions.
-   **Deep Eligibility Analysis:** Get a strict verification of your eligibility based on your profile (land holding, crop type, caste, state) with direct quotes from documents.
-   **Smart Recommendations:** A personalized dashboard that suggests schemes tailored to your specific profile.
-   **Voice-to-Profile Extraction:** Talk to the AI in Hindi or English to automatically update your farmer profile—no complex forms required.
-   **Impact Metrics Dashboard:** Real-time tracking of schemes analyzed, eligibility checks performed, and AI performance.
-   **Admin Ingestion Engine:** Automated processing of scheme PDFs into vector embeddings for instant availability in the search engine.

## Tech Stack

### Frontend
-   **React 19** with **TypeScript**
-   **Vite** (Build Tool)
-   **Tailwind CSS** (Styling)
-   **Lucide React** (Icons)
-   **Axios** (API Client)
-   **React Router 7** (Navigation)

### Backend
-   **Node.js & Express**
-   **MongoDB & Mongoose** (Database)
-   **Google Gemini AI (2.5-Flash & Embedding-001)** (LLM & Vectors)
-   **LangChain** (Text Splitting)
-   **Multer & PDF-Parse** (Document Processing)
-   **JWT & Cookie-Parser** (Authentication)
-   **Swagger UI** (API Documentation)

## Prerequisites

-   Node.js (v18+)
-   MongoDB Atlas account or local instance
-   Google Gemini API Key (from Google AI Studio)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/niti-setu.git
cd niti-setu
```

### 2. Backend Configuration
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_uri
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
ADMIN_SECRET=your_admin_password
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Configuration
Navigate to the frontend folder and install dependencies:
```bash
cd ../frontend
npm install
```
The frontend is pre-configured to proxy API requests to `http://localhost:5000`.

Start the frontend:
```bash
npm run dev
```

## API Documentation

Once the backend is running, you can access the interactive Swagger documentation at:
`http://localhost:5000/api-docs`

## Project Structure

```text
niti-setu/
├── backend/
│   ├── config/         # DB & Swagger config
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth & Protection
│   ├── models/         # Mongoose Schemas
│   ├── routes/         # API Endpoints
│   ├── utils/          # AI Orchestrator (Gemini logic)
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Auth State management
│   │   ├── pages/      # Main views (Dashboard, Chat, etc.)
│   │   └── services/   # API integration
│   └── tailwind.config.js
└── README.md
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built for the [Ajrasakha Hackathon](https://vicharanashala.github.io/ajrasakha-hackathon/).*
