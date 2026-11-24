import { Router } from "express";
import authorController from "../controllers/authorController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

router.get("/", authorController.getAll);
router.get("/:id", authorController.getById);
router.post("/", adminAuth, authorController.create);
router.put("/:id", adminAuth, authorController.update);
router.delete("/:id", adminAuth, authorController.remove);

export default router;
