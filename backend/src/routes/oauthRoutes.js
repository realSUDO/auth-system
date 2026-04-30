import { Router } from "express";
import { authorize, token, registerClient } from "../controllers/oauthController.js";
import { requestAccess, listRequests, approveRequest, rejectRequest } from "../controllers/requestController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.get("/oauth/authorize", authorize);
router.post("/oauth/token", token);
router.post("/oauth/clients", requireAdmin, registerClient);
router.post("/oauth/request-access", requestAccess);
router.get("/oauth/requests", requireAdmin, listRequests);
router.post("/oauth/requests/:id/approve", requireAdmin, approveRequest);
router.post("/oauth/requests/:id/reject", requireAdmin, rejectRequest);

export default router;
