import { Router } from "express";
import workController from "../controllers/workController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

router.get("/", workController.getAll);
router.get("/:id", workController.getById);
router.post("/", adminAuth, workController.create);
router.put("/:id", adminAuth, workController.update);
router.delete("/:id", adminAuth, workController.remove);

export default router;
