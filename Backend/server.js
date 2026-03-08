import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "./routes/auth.js";
import caseRoutes from "./routes/cases.js";
import employeeRoutes from "./routes/employees.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/v1", authRoutes);
app.use("/api/v1", caseRoutes);
app.use("/api/v1", employeeRoutes);

app.get("/", (req, res) => {
  res.json({ status: "HCM Backend running" });
});

async function startServer() {
  // Use default temp db path to avoid stale lock-file conflicts on restarts.
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

  const demoCitizen = await User.findOne({ email: "citizen@test.com" });
  if (!demoCitizen) {
    await User.create({
      name: "Citizen User",
      email: "citizen@test.com",
      phone: "9876543210",
      gender: "MALE",
      age: 30,
      aadhaar: "123412341234",
      password: "test123",
      role: "citizen",
      isVerified: true,
    });
    console.log("Citizen seeded: citizen@test.com / test123");
  }

  const amanCitizen = await User.findOne({ email: "amanmathssogani@gmail.com" });
  if (!amanCitizen) {
    await User.create({
      name: "Aman Sogani",
      email: "amanmathssogani@gmail.com",
      phone: "9876543215",
      gender: "MALE",
      age: 25,
      aadhaar: "345678901234",
      password: "aman123",
      role: "citizen",
      isVerified: true,
    });
    console.log("Citizen seeded: amanmathssogani@gmail.com / aman123");
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err.message);
  process.exit(1);
});




