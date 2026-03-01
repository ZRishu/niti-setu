import {
  createUser,
  findUserByEmail,
  findUserById,
  hashPassword,
  normalizeUserInput,
  publicUser,
  setUserRole,
  validatePassword,
  verifyPassword
} from "../models/User.js";
import { createCookieHeader, json, serverError, unauthorized, badRequest } from "../lib/http.js";
import { signJwt } from "../lib/jwt.js";

const getRoleFromAdminSecret = (adminSecret) => {
  if (!adminSecret) return { role: "user" };
  if (adminSecret.trim() !== Bun.env.ADMIN_SECRET) {
    return { error: unauthorized("Invalid Admin Secret Key") };
  }
  return { role: "admin" };
};

const tokenResponse = async (user, statusCode = 200) => {
  const token = await signJwt({ id: user._id.toString() });

  return json(
    {
      success: true,
      token,
      user: publicUser(user)
    },
    statusCode,
    {
      "Set-Cookie": createCookieHeader("token", token, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        path: "/",
        sameSite: "Lax",
        secure: Bun.env.NODE_ENV === "production"
      })
    }
  );
};

export const register = async ({ body }) => {
  try {
    const { name, email, phoneNumber, password, profile, adminSecret } = body || {};

    const normalized = normalizeUserInput({ name, email, phoneNumber });
    validatePassword(password);

    const existing = await findUserByEmail(normalized.email, false);
    if (existing) {
      return badRequest("User already exists with this email");
    }

    const roleCheck = getRoleFromAdminSecret(adminSecret);
    if (roleCheck.error) return roleCheck.error;

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      ...normalized,
      password: passwordHash,
      role: roleCheck.role,
      profile
    });

    return tokenResponse(user, 200);
  } catch (error) {
    if (error.message?.includes("E11000")) {
      return badRequest("User already exists with this email");
    }
    return serverError(error.message || "Registration failed");
  }
};

export const login = async ({ body }) => {
  try {
    const { email, password, adminSecret } = body || {};

    if (!email || !password) {
      return badRequest("Please provide an email and password");
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(trimmedEmail, true);
    if (!user) {
      return unauthorized("Invalid credentials");
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return unauthorized("Invalid credentials");
    }

    if (adminSecret) {
      if (adminSecret.trim() !== Bun.env.ADMIN_SECRET) {
        return unauthorized("Invalid Admin Secret Key");
      }
      if (user.role !== "admin") {
        await setUserRole(user._id.toString(), "admin");
        user.role = "admin";
      }
    }

    delete user.password;
    return tokenResponse(user, 200);
  } catch (error) {
    return serverError(error.message || "Login failed");
  }
};

export const getMe = async ({ user }) => {
  try {
    const currentUser = await findUserById(user._id.toString(), false);
    if (!currentUser) {
      return unauthorized("Not authorized to access this route");
    }

    return json({ success: true, data: currentUser }, 200);
  } catch (error) {
    return serverError(error.message || "Failed to fetch profile");
  }
};
