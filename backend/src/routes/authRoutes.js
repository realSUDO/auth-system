import { Router } from "express";
import { signup , login , verify } from "../controllers/authController.js"
import {validate , signUpSchema , loginSchema} from "../middleware/validation.js";


const router = Router();


router.post("/signup", validate(signUpSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/verify", verify);

export default router;




