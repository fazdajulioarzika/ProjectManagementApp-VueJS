import { Router } from "express";
import {
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { commentRules } from "../utils/validators.js";

const router = Router();
router.use(protect);

router
  .route("/:id")
  .put(commentRules, validate, updateComment)
  .delete(deleteComment);

export default router;
