import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    profileImg: { type: String, default: "" },
    joinDate: { type: Date, default: Date.now },
    salary: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
