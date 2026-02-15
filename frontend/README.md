# Niti-Setu Frontend

This is the React frontend for the Niti-Setu application, designed to help citizens discover government schemes using AI.

## Features

- **Scheme Search:** Filter schemes by state, gender, and caste.
- **AI Chat Assistant:** Ask questions about schemes using natural language.
- **Admin Ingest:** Upload scheme PDF documents to the knowledge base.
- **Responsive Design:** Built with Tailwind CSS for mobile and desktop.

## Prerequisites

- Node.js (v18+)
- Backend server running on port 5000

## Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## Project Structure

- `src/components`: Reusable UI components (Navbar, Footer, etc.)
- `src/pages`: Main application views (Home, Search, Chat, Ingest)
- `src/services`: API communication logic

## Environment Variables

No `.env` file is required for default local development as the proxy is configured in `vite.config.ts` to point to `http://localhost:5000`.