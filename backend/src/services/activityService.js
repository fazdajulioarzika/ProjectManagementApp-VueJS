import Activity from "../models/Activity.js";

// Kegagalan mencatat log tidak boleh menggagalkan aksi utamanya
export const logActivity = async ({
  project,
  user,
  action,
  target = "",
  metadata = {},
}) => {
  try {
    await Activity.create({ project, user, action, target, metadata });
  } catch (err) {
    console.error("Gagal mencatat aktivitas:", err.message);
  }
};
