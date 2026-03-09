import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    ministerName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

departmentSchema.index(
  { name: 1, state: 1, ministerName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export default mongoose.model("Department", departmentSchema);