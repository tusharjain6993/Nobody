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
    status: {
      type: String,
      enum: ["SUBMITTED", "IN_REVIEW", "RESOLVED", "REJECTED"],
      default: "SUBMITTED",
      index: true,
    },
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
