import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { requireAuth } from "../middleware/auth.js";
import { maskUserResponse } from "../utils/mask.js";
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

    const citizenCount = await User.countDocuments({ role: "citizen" });
    const citizenUniqueId = `CTZ-HP-${String(citizenCount + 1).padStart(6, "0")}`;

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      gender,
      age,
      aadhaar: cleanedAadhaar,
      password,
      role: "citizen",
      citizenUniqueId,
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
      citizenUniqueId: user.citizenUniqueId,
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

    const updated = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );
    await Otp.deleteMany({ email });

    res.json({
      message: "Registration successful! You can now login with your Citizen ID.",
      citizenUniqueId: updated?.citizenUniqueId,
    });
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

router.post("/send-login-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const phone = String(req.body?.phone || "").replace(/\D/g, "").trim();
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const user = email
      ? await User.findOne({ email, isVerified: true })
      : await User.findOne({ phone: phone || req.body?.phone?.trim(), isVerified: true });
    if (!user) {
      return res.status(404).json({ message: "No verified account found for this email or phone" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const phoneNorm = user.phone ? String(user.phone).replace(/\D/g, "").trim() : null;
    await Otp.deleteMany({ $or: [{ email: user.email }, { phone: phoneNorm }].filter((q) => Object.values(q)[0]) });
    await Otp.create({
      email: user.email || null,
      phone: phoneNorm,
      otp,
      expiresAt,
    });

    if (user.email) {
      try {
        await sendOtpEmail(user.email, otp);
      } catch (emailErr) {
        console.error("Login OTP email error:", emailErr.message);
        console.log(`\n>>> Login OTP for ${user.email}: ${otp}\n`);
      }
    }
    if (user.phone && !user.email) {
      console.log(`[SMS stub] Login OTP to ${user.phone}: ${otp}`);
    }

    const response = {
      message: user.email ? "OTP sent to your email." : "OTP sent to your phone.",
      email: user.email || undefined,
      phone: user.phone ? "****" + user.phone.slice(-4) : undefined,
    };
    if (process.env.NODE_ENV !== "production") response.devOtp = otp;
    res.json(response);
  } catch (err) {
    console.error("Send login OTP error:", err);
    res.status(500).json({ message: err.message || "Failed to send OTP" });
  }
});

router.post("/login-with-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const phone = String(req.body?.phone || "").replace(/\D/g, "").trim();
    const otp = normalizeOtp(req.body?.otp);
    if ((!email && !phone) || !otp) {
      return res.status(400).json({ message: "Email or phone, and OTP are required" });
    }

    const record = await Otp.findOne(
      email ? { email } : { phone }
    ).sort({ _id: -1 });
    if (!record) return res.status(400).json({ message: "No OTP found. Request a new one." });
    if (record.expiresAt < new Date()) {
      await Otp.deleteMany(record.email ? { email: record.email } : { phone: record.phone });
      return res.status(400).json({ message: "OTP has expired." });
    }
    if (String(record.otp) !== otp) return res.status(401).json({ message: "Invalid OTP" });

    const user = await User.findOne(record.email ? { email: record.email } : { phone: record.phone }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    await Otp.deleteMany(record.email ? { email: record.email } : { phone: record.phone });

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
    console.error("Login with OTP error:", err);
    res.status(500).json({ message: err.message || "Login failed" });
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

// Citizen login using unique Citizen ID (no email/password)
router.post("/citizen-id-login", async (req, res) => {
  try {
    const rawId = String(req.body?.citizenId || req.body?.citizenUniqueId || "").trim();
    if (!rawId) {
      return res.status(400).json({ message: "Citizen ID is required" });
    }

    const citizen = await User.findOne({
      citizenUniqueId: rawId,
      role: "citizen",
      isVerified: true,
    });
    if (!citizen) {
      return res.status(404).json({ message: "No verified citizen found for this ID" });
    }

    const token = jwt.sign(
      { id: citizen._id, email: citizen.email, role: citizen.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: citizen._id,
        name: citizen.name,
        email: citizen.email,
        role: citizen.role,
        phone: citizen.phone,
        gender: citizen.gender,
        age: citizen.age,
        citizenUniqueId: citizen.citizenUniqueId,
      },
    });
  } catch (err) {
    console.error("Citizen ID login error:", err);
    res.status(500).json({ message: err.message || "Login failed" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: maskUserResponse(req.user) });
});

export default router;

