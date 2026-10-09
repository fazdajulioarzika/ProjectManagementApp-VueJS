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
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  // Hanya name dan avatar yang boleh diubah. Role dan email sengaja tidak disentuh.
  if (name !== undefined) req.user.name = name;
  if (avatar !== undefined) req.user.avatar = avatar;
  await req.user.save();

  res.json({ success: true, data: { user: req.user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    // 400, bukan 401: interceptor frontend akan menganggap 401 sebagai token kedaluwarsa dan memaksa logout
    throw new AppError("Password saat ini salah", 400);
  }
  if (currentPassword === newPassword) {
    throw new AppError(
      "Password baru harus berbeda dari password saat ini",
      400
    );
  }

  user.password = newPassword; // di-hash otomatis oleh hook pre('save')
  await user.save();

  res.json({ success: true, message: "Password berhasil diubah" });
});
