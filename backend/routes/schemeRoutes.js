import {
  chatWithScheme,
  checkSchemeEligibility,
  getAllSchemes,
  getDashboardMetrics,
  getRecommendedSchemes,
  ingestScheme,
  parseVoiceProfile,
  searchSchemes
} from "../controllers/schemeController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const registerSchemeRoutes = (router) => {
  router.on("POST", "/api/v1/schemes/ingest", async (ctx) => {
    const auth = await requireAuth(ctx.request, ctx.cookies);
    if (auth.error) return auth.error;

    const roleError = requireRole(auth.user, ["admin"]);
    if (roleError) return roleError;

    return ingestScheme({ ...ctx, user: auth.user });
  });

  router.on("POST", "/api/v1/schemes/search", async (ctx) => searchSchemes(ctx));
  router.on("GET", "/api/v1/schemes/debug", async () => getAllSchemes());

  router.on("POST", "/api/v1/schemes/chat", async (ctx) => {
    const auth = await requireAuth(ctx.request, ctx.cookies);
    if (auth.error) return auth.error;

    return chatWithScheme({ ...ctx, user: auth.user });
  });

  router.on("POST", "/api/v1/schemes/recommend", async (ctx) => getRecommendedSchemes(ctx));
  router.on("POST", "/api/v1/schemes/eligibility", async (ctx) => checkSchemeEligibility(ctx));
  router.on("POST", "/api/v1/schemes/extract-profile", async (ctx) => parseVoiceProfile(ctx));
  router.on("GET", "/api/v1/schemes/metrics", async () => getDashboardMetrics());
};
