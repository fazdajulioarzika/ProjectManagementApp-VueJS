import { Router } from "express";
import { listUsers, updateUserRole } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { roleUpdateRules } from "../utils/validators.js";

const router = Router();
router.use(protect);

router.get("/", authorize("admin", "manager"), listUsers);
router.patch(
  "/:id/role",
  authorize("admin"),
  roleUpdateRules,
  validate,
  updateUserRole
);

export default router;
