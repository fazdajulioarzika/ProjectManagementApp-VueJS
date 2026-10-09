import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
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
const profileRules = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nama tidak boleh kosong")
    .isLength({ max: 50 })
    .withMessage("Nama maksimal 50 karakter"),
  body("avatar")
    .optional()
    .isString()
    .isLength({ max: 60000 })
    .withMessage("Gambar avatar terlalu besar")
    .custom(
      (v) =>
        v === "" ||
        /^data:image\/(png|jpe?g|webp);base64,/.test(v) ||
        /^https?:\/\//.test(v)
    )
    .withMessage("Format avatar tidak valid"),
];

const passwordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Password saat ini wajib diisi"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password baru minimal 6 karakter"),
];

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

router.put("/profile", protect, profileRules, validate, updateProfile);
router.put("/password", protect, passwordRules, validate, changePassword);
export default router;
