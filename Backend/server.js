import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/v1", authRoutes);

app.get("/", (req, res) => {
  res.json({ status: "HCM Backend running" });
});

async function startServer() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);
  console.log("In-memory MongoDB connected at", uri);

  const existingAdmin = await User.findOne({ email: "admin@portal.gov" });
  if (!existingAdmin) {
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
    console.log("Admin seeded: admin@portal.gov / admin123");
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err.message);
  process.exit(1);
});
