const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (input) => {
  let bytes;
  if (typeof input === "string") {
    bytes = encoder.encode(input);
  } else {
    bytes = input;
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (base64url) => {
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const parseDurationToSeconds = (value) => {
  if (!value) return 30 * 24 * 60 * 60;
  if (/^\d+$/.test(value)) return Number(value);

  const match = String(value).match(/^(\d+)([smhd])$/i);
  if (!match) return 30 * 24 * 60 * 60;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 3600;
  return amount * 86400;
};

const getSecretKey = async () => {
  const secret = Bun.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

export const signJwt = async (payload) => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDurationToSeconds(Bun.env.JWT_EXPIRE || "30d");

  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: now, exp };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedBody = toBase64Url(JSON.stringify(body));
  const content = `${encodedHeader}.${encodedBody}`;

  const key = await getSecretKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(content));

  return `${content}.${toBase64Url(new Uint8Array(signature))}`;
};

export const verifyJwt = async (token) => {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");

  const [encodedHeader, encodedBody, encodedSignature] = parts;
  const content = `${encodedHeader}.${encodedBody}`;
  const key = await getSecretKey();

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(encodedSignature),
    encoder.encode(content)
  );

  if (!isValid) throw new Error("Invalid token signature");

  const payload = JSON.parse(decoder.decode(fromBase64Url(encodedBody)));
  if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
};
