import { Router } from "express";
import authController from "../controllers/authController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

router.post("/login", authController.login);
router.get("/verify", adminAuth, authController.verify);

export default router;
