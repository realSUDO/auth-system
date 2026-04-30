import { Router } from "express";
import { authorize, token, registerClient } from "../controllers/oauthController.js";

const router = Router();

router.get("/oauth/authorize", authorize);
router.post("/oauth/token", token);
router.post("/oauth/clients", registerClient);

export default router;
