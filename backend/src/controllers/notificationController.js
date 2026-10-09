import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { syncDeadlineNotification } from "../services/notificationService.js";

export const getNotifications = asyncHandler(async (req, res) => {
  await syncDeadlineNotification(req.user);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort("-createdAt").limit(30),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({ success: true, data: { notifications, unreadCount } });
});

export const markRead = asyncHandler(async (req, res) => {
  // Filter user memastikan orang hanya bisa mengubah notifikasinya sendiri
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!n) throw new AppError("Notifikasi tidak ditemukan", 404);

  res.json({ success: true, data: { notification: n } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );
  res.json({
    success: true,
    message: "Semua notifikasi ditandai sudah dibaca",
  });
});
