import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, default: null },
  phone: { type: String, trim: true, default: null },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });
otpSchema.index({ phone: 1 });

export default mongoose.model("Otp", otpSchema);
