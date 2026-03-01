const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8"
};

const configuredFrontendOrigin = (Bun.env.FRONTEND_URL || "").trim();

export const getFrontendOrigin = () => configuredFrontendOrigin;

export const isOriginAllowed = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === configuredFrontendOrigin;
};

export const getCorsHeaders = (request) => {
  return {
    "Access-Control-Allow-Origin": configuredFrontendOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    Vary: "Origin"
  };
};

export const withCors = (request, response) => {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      ...headers
    }
  });

export const text = (body, status = 200, headers = {}) =>
  new Response(body, {
    status,
    headers
  });

export const parseJsonBody = async (request) => {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return {};

  try {
    return await request.json();
  } catch {
    return {};
  }
};

export const parseCookies = (request) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = {};

  if (!cookieHeader) return cookies;

  for (const pair of cookieHeader.split(";")) {
    const [rawName, ...rest] = pair.trim().split("=");
    if (!rawName) continue;
    cookies[rawName] = decodeURIComponent(rest.join("="));
  }

  return cookies;
};

export const createCookieHeader = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  return parts.join("; ");
};

export const badRequest = (message) => json({ success: false, error: message }, 400);
export const unauthorized = (message) => json({ success: false, error: message }, 401);
export const forbidden = (message) => json({ success: false, error: message }, 403);
export const notFound = (message) => json({ success: false, error: message }, 404);
export const serverError = (message) => json({ success: false, error: message }, 500);
