import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // role sengaja TIDAK diambil dari body, supaya orang tidak bisa daftar sebagai admin
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    data: { user, token: generateToken(user._id) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Email atau password salah", 401);
  }

  res.json({
    success: true,
    data: { user, token: generateToken(user._id) },
  });
});

// JWT bersifat stateless: token dihapus di frontend
export const logout = (req, res) => {
  res.json({ success: true, message: "Logout berhasil" });
};

export const getMe = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};
