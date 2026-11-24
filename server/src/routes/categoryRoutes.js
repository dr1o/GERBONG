import { Router } from "express";
import categoryController from "../controllers/categoryController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);
router.post("/", adminAuth, categoryController.create);
router.put("/:id", adminAuth, categoryController.update);
router.delete("/:id", adminAuth, categoryController.remove);

export default router;
