# Niti-Setu Backend API (Bun)

This backend now runs on Bun with a native Bun HTTP server and Web APIs.

## Stack

- Bun runtime (`Bun.serve`, `Bun.password`, native `fetch`)
- MongoDB with official `mongodb` driver
- Groq + Jina integrations via native HTTP calls
- PDF text ingestion via `pdf-parse`

## Prerequisites

- Latest Bun runtime
- MongoDB Atlas/local MongoDB

## Setup

```bash
cd backend
bun install
cp .ENV_EXAMPLE .env
```

## Run

```bash
bun run dev
```

Production:

```bash
bun run start
```

Server URL:

- `http://localhost:5000`
- Docs: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs/openapi.json`

## Environment Variables

```env
PORT=5000
NODE_ENV=development
API_VERSION=2.0.0
MONGO_URI=your_mongodb_atlas_uri
GROQ_API_KEY=your_groq_api_key
JINA_API_KEY=your_jina_api_key
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
ADMIN_SECRET=your_admin_secret_here
FRONTEND_URL=http://localhost:5173
```

## Notes

- Frontend API paths and JSON response shapes are preserved.
- Auth still supports Bearer token and cookie token flows.
- `/api-docs` is served without Express/Swagger middleware.
- OpenAPI spec is generated as `3.1.1` with API version controlled by `API_VERSION`.
- Backend dependencies are configured with `latest` tags in `package.json`.
- Backend accepts browser requests only from the exact `FRONTEND_URL` origin.
