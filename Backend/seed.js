import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: "admin@portal.gov" });
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
  } else {
    await User.create({
      name: "Admin User",
      email: "admin@portal.gov",
      phone: "9999999999",
      gender: "MALE",
      age: 35,
      aadhaar: "999999999999",
      password: "admin123",
      role: "admin",
      isVerified: true,
    });
    console.log("Admin user created: admin@portal.gov / admin123");
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
