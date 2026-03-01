import { getMe, login, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const registerAuthRoutes = (router) => {
  router.on("POST", "/api/v1/auth/register", async (ctx) => register(ctx));
  router.on("POST", "/api/v1/auth/login", async (ctx) => login(ctx));

  router.on("GET", "/api/v1/auth/me", async (ctx) => {
    const auth = await requireAuth(ctx.request, ctx.cookies);
    if (auth.error) return auth.error;

    return getMe({ ...ctx, user: auth.user });
  });
};
