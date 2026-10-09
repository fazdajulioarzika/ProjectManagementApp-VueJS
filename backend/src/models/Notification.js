import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["task.assigned", "task.deadline"],
      required: true,
    },
    message: { type: String, required: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    read: { type: Boolean, default: false },
    dedupeKey: { type: String }, // mencegah notifikasi deadline ganda di hari yang sama
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }
);

export default mongoose.model("Notification", notificationSchema);
