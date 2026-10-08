import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search)), "i");
    filter.$or = [{ name: re }, { email: re }];
  }
  const users = await User.find(filter)
    .select("name email avatar role")
    .sort("name")
    .limit(50);
  res.json({ success: true, count: users.length, data: { users } });
});
