import { Router } from "express";
import { openidConfig, jwks, userinfo } from "../controllers/oidcController.js";

const router = Router();

router.get("/.well-known/openid-configuration", openidConfig);
router.get("/jwks", jwks);
router.get("/oauth/userinfo", userinfo);

export default router;
