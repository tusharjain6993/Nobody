import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    caseId: { type: String, unique: true, index: true },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    citizenSnapshot: {
      name: String,
      email: String,
      phone: String,
      aadhaar: String,
      gender: String,
      age: Number,
    },
    purpose: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    referralPerson: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    districtCity: { type: String, required: true, trim: true },
    localAreaMinister: { type: String, required: true, trim: true },
    urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
    details: { type: String, trim: true },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
        "REQUEST_CLARIFICATION",
        "RESOLVED",
        "RESOLVED_WITHOUT_MEETING",
        "SCHEDULED",
        "CLOSED",
      ],
      default: "SUBMITTED",
      index: true,
    },
    // Backward compatibility: RESOLVED = CLOSED; IN_REVIEW kept for "under review"
    reviewNote: { type: String, trim: true },
    resolvedWithoutMeeting: { type: Boolean, default: false },
    schedule: {
      scheduledAt: { type: Date },
      slot: { type: String, trim: true },
      type: { type: String, trim: true },
      venue: { type: String, trim: true },
    },
    meetingSummary: { type: String, trim: true },
    actionRequired: { type: String, trim: true },
    responsibleAuthority: { type: String, trim: true },
    assignments: [
      {
        title: { type: String, required: true, trim: true },
        assignedToName: { type: String, trim: true },
        priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
        status: { type: String, enum: ["PENDING", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"], default: "PENDING" },
        dueDate: { type: Date },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    communications: [
      {
        type: { type: String, enum: ["CALL", "LETTER", "EMAIL", "MEETING_NOTE"], required: true },
        summary: { type: String, required: true, trim: true },
        happenedAt: { type: Date, default: Date.now },
        createdByName: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isArchived: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

caseSchema.pre("save", async function assignCaseId(next) {
  if (this.caseId) return next();
  const count = await mongoose.model("Case").countDocuments();
  this.caseId = `HP-CASE-${String(count + 1).padStart(6, "0")}`;
  next();
});

export default mongoose.model("Case", caseSchema);
