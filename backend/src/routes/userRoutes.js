import { Router } from "express";
import { listUsers } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, authorize("admin", "manager"), listUsers);

export default router;
