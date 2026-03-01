import { connectDB } from "./config/db.js";
import swaggerSpec from "./config/swagger.js";
import {
  withCors,
  json,
  parseCookies,
  parseJsonBody,
  notFound,
  forbidden,
  getFrontendOrigin,
  isOriginAllowed
} from "./lib/http.js";
import { Router } from "./lib/router.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";
import { registerSchemeRoutes } from "./routes/schemeRoutes.js";

if (!getFrontendOrigin()) {
  console.error("FRONTEND_URL is required and must be set to the frontend origin.");
  process.exit(1);
}

try {
  await connectDB();
} catch (error) {
  console.error(`Failed to connect MongoDB: ${error.message}`);
  process.exit(1);
}

const router = new Router();
registerAuthRoutes(router);
registerSchemeRoutes(router);

router.on("GET", "/api/v1/health", async () =>
  json({ status: "API Online", timestamp: new Date().toISOString() }, 200)
);

router.on("GET", "/api-docs/openapi.json", async () => json(swaggerSpec, 200));

const docsHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Niti-Setu API Docs</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    header { padding: 16px 20px; background: #0f172a; color: #fff; }
    main { padding: 20px; }
    a { color: #0369a1; }
  </style>
</head>
<body>
  <header><h2>Niti-Setu API Docs</h2></header>
  <main>
    <p>OpenAPI JSON: <a href="/api-docs/openapi.json">/api-docs/openapi.json</a></p>
    <div id="redoc-container"></div>
  </main>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('/api-docs/openapi.json', {}, document.getElementById('redoc-container'));
  </script>
</body>
</html>`;

router.on("GET", "/api-docs", async () =>
  new Response(docsHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  })
);

const server = Bun.serve({
  port: Number(Bun.env.PORT || 5000),
  async fetch(request) {
    const url = new URL(request.url);

    console.log(`[${new Date().toISOString()}] ${request.method} request to ${url.pathname}`);

    if (!isOriginAllowed(request)) {
      return withCors(request, forbidden("Request origin is not allowed"));
    }

    if (request.method === "OPTIONS") {
      return withCors(request, new Response(null, { status: 204 }));
    }

    const cookies = parseCookies(request);
    let body = {};

    const contentType = request.headers.get("content-type") || "";
    if (request.method !== "GET" && request.method !== "HEAD" && contentType.includes("application/json")) {
      body = await parseJsonBody(request);
    }

    const response = await router.handle(request, { cookies, body });

    if (response) {
      return withCors(request, response);
    }

    if (url.pathname.startsWith("/api/v1/")) {
      return withCors(request, notFound(`Route ${url.pathname} not found on Niti-Setu API`));
    }

    return withCors(request, notFound("Route not found"));
  }
});

console.log(`Server running in ${Bun.env.NODE_ENV || "development"} mode on port ${server.port}`);
console.log(`Swagger Docs available at http://localhost:${server.port}/api-docs`);
