const serverUrl = `http://localhost:${Bun.env.PORT || 5000}/api/v1`;
const apiVersion = Bun.env.API_VERSION || "2.0.0";

const swaggerSpec = {
  openapi: "3.1.1",
  info: {
    title: "Niti-Setu API",
    version: apiVersion,
    description: "Voice-Based Government Scheme Eligibility Engine"
  },
  servers: [{ url: serverUrl, description: "Bun Development Server" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": { description: "API Online" }
        }
      }
    },
    "/auth/register": { post: { summary: "Register user", responses: { "200": { description: "User registered" } } } },
    "/auth/login": { post: { summary: "Login user", responses: { "200": { description: "User logged in" } } } },
    "/auth/me": { get: { summary: "Current user", responses: { "200": { description: "User profile" } } } },
    "/schemes/search": { post: { summary: "Search schemes", responses: { "200": { description: "Search results" } } } },
    "/schemes/chat": { post: { summary: "Chat with scheme AI", responses: { "200": { description: "Answer" } } } },
    "/schemes/recommend": { post: { summary: "Recommend schemes", responses: { "200": { description: "Recommendations" } } } },
    "/schemes/eligibility": { post: { summary: "Eligibility check", responses: { "200": { description: "Eligibility result" } } } },
    "/schemes/extract-profile": { post: { summary: "Extract profile", responses: { "200": { description: "Profile" } } } },
    "/schemes/metrics": { get: { summary: "Dashboard metrics", responses: { "200": { description: "Metrics" } } } }
  }
};

export default swaggerSpec;
