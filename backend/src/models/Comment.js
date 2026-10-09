import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: [true, "Komentar tidak boleh kosong"],
      trim: true,
      maxlength: [1000, "Komentar maksimal 1000 karakter"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
