import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sameId } from "../utils/access.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search)), "i");
    filter.$or = [{ name: re }, { email: re }];
  }
  const users = await User.find(filter)
    .select("name email avatar role createdAt")
    .sort("name")
    .limit(50);

  res.json({ success: true, count: users.length, data: { users } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  // Mencegah admin mengunci dirinya sendiri dari aplikasi
  if (sameId(req.params.id, req.user._id)) {
    throw new AppError("Anda tidak dapat mengubah role Anda sendiri", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  ).select("name email avatar role createdAt");
  if (!user) throw new AppError("User tidak ditemukan", 404);

  res.json({ success: true, data: { user } });
});
