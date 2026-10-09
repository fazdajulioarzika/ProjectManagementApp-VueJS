import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import { sameId } from "../utils/access.js";

// Dipanggil saat task ditugaskan. Tidak mengirim notifikasi ke diri sendiri.
export const notifyAssigned = async ({ task, actor }) => {
  try {
    const assigneeId = task.assignee?._id ?? task.assignee;
    if (!assigneeId || sameId(assigneeId, actor._id)) return;

    await Notification.create({
      user: assigneeId,
      type: "task.assigned",
      message: `Anda ditugaskan pada task "${task.title}"`,
      project: task.project,
      task: task._id,
    });
  } catch (err) {
    console.error("Gagal membuat notifikasi:", err.message);
  }
};

// Task milik user yang belum selesai dan jatuh tempo dalam 3 hari ke depan (UTC)
export const syncDeadlineNotification = async (user) => {
  try {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const startOfDay = new Date(`${day}T00:00:00.000Z`);
    const soon = new Date(startOfDay.getTime() + 3 * 24 * 60 * 60 * 1000);

    const count = await Task.countDocuments({
      assignee: user._id,
      status: { $ne: "done" },
      dueDate: { $gte: startOfDay, $lte: soon },
    });
    if (!count) return;

    await Notification.updateOne(
      { user: user._id, dedupeKey: `deadline:${day}` },
      {
        $set: {
          message: `Anda memiliki ${count} task yang mendekati deadline`,
        },
        $setOnInsert: { type: "task.deadline", read: false },
      },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000)
      console.error("Gagal sinkron notifikasi deadline:", err.message);
  }
};
