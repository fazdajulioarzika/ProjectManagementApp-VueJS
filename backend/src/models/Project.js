import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, default: "Member" }, // jabatan, mis. Frontend Developer
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama project wajib diisi"],
      trim: true,
      maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "archived"],
      default: "planning",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSchema],
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ "members.user": 1 });

projectSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "Tanggal selesai harus setelah tanggal mulai");
  }
});

export default mongoose.model("Project", projectSchema);
