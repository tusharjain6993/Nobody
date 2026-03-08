import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendOtpEmail } from "../utils/sendEmail.js";

const router = Router();

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const normalizeOtp = (value = "") => String(value).replace(/\D/g, "").trim();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, gender, age, aadhaar, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !phone || !gender || !age || !aadhaar || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanedAadhaar = String(aadhaar).replace(/\s/g, "");

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { aadhaar: cleanedAadhaar }] });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: "User with this email or Aadhaar already exists" });
    }

    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      gender,
      age,
      aadhaar: cleanedAadhaar,
      password,
      role: "citizen",
      isVerified: false,
    });

    const otp = generateOtp();
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    let emailSent = false;
    try {
      await sendOtpEmail(normalizedEmail, otp);
      emailSent = true;
    } catch (emailErr) {
      console.error("Email error:", emailErr.message || emailErr);
      console.log(`\n>>> OTP for ${normalizedEmail}: ${otp} (email failed)\n`);
    }

    const response = {
      message: emailSent
        ? "OTP sent to your email. Please verify to complete registration."
        : "OTP generated. Check your email (or use the dev OTP shown below).",
      userId: user._id,
      email: user.email,
    };
    if (process.env.NODE_ENV !== "production" || !emailSent) response.devOtp = otp;

    res.status(201).json(response);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Registration failed" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = normalizeOtp(req.body?.otp);

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No pending registration found for this email" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email already verified. You can login." });
    }

    // Always compare against the latest OTP for this email.
    const record = await Otp.findOne({ email }).sort({ _id: -1 });
    if (!record) {
      return res.status(400).json({ message: "No OTP found. Please resend OTP." });
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (String(record.otp) !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await User.updateOne({ email }, { isVerified: true });
    await Otp.deleteMany({ email });

    res.json({ message: "Registration successful! You can now login." });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email, isVerified: false });
    if (!user) return res.status(404).json({ message: "No pending registration found for this email" });

    const otp = generateOtp();
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    let emailSent = false;
    try {
      await sendOtpEmail(email, otp);
      emailSent = true;
    } catch (emailErr) {
      console.error("Email error:", emailErr.message || emailErr);
      console.log(`\n>>> OTP for ${email}: ${otp} (email failed)\n`);
    }

    const response = { message: "New OTP sent to your email" };
    if (process.env.NODE_ENV !== "production" || !emailSent) response.devOtp = otp;

    res.json(response);
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        age: user.age,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;

