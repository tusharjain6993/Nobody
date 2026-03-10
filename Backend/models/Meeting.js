import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", index: true },
    caseNumber: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    assignedToName: { type: String, trim: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    dueDate: { type: Date },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], default: "PENDING" },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);
