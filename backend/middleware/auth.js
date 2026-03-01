import { findUserById } from "../models/User.js";
import { verifyJwt } from "../lib/jwt.js";
import { unauthorized, forbidden } from "../lib/http.js";

export const extractToken = (request, cookies = {}) => {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.split(" ")[1];
  if (cookies.token) return cookies.token;
  return null;
};

export const requireAuth = async (request, cookies = {}) => {
  const token = extractToken(request, cookies);
  if (!token) {
    return { error: unauthorized("Not authorized to access this route") };
  }

  try {
    const decoded = await verifyJwt(token);
    const user = await findUserById(decoded.id);
    if (!user) {
      return { error: unauthorized("Not authorized to access this route") };
    }

    return { user };
  } catch {
    return { error: unauthorized("Not authorized to access this route") };
  }
};

export const requireRole = (user, roles = []) => {
  if (!roles.includes(user.role)) {
    return forbidden(`User role ${user.role} is not authorized to access this route`);
  }
  return null;
};
