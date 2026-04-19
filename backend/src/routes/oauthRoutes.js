import { Router } from "express";
import { authorize, token } from "../controllers/oauthController.js";

const router = Router();
router.get("/oauth/authorize", authorize);
router.post("/oauth/token", token);

export default router;
