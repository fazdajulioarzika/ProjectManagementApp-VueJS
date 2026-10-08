import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const registerRules = [
  body("name").trim().notEmpty().withMessage("Nama wajib diisi"),
  body("email").trim().toLowerCase().isEmail().withMessage("Email tidak valid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password minimal 6 karakter"),
];

const loginRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("Email tidak valid"),
  body("password").notEmpty().withMessage("Password wajib diisi"),
];

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
