import mongoose from "mongoose";

export const ACTIONS = [
  "project.created",
  "project.updated",
  "member.added",
  "member.removed",
  "task.created",
  "task.moved",
  "task.completed",
  "task.assigned",
  "task.deleted",
  "comment.added",
];

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ACTIONS, required: true },
    target: { type: String, default: "" }, // nama task / project / user yang terlibat
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ project: 1, createdAt: -1 });

export default mongoose.model("Activity", activitySchema);
