import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "./routes/auth.js";
import caseRoutes from "./routes/cases.js";
import employeeRoutes from "./routes/employees.js";
import departmentRoutes from "./routes/departments.js";
import notificationRoutes from "./routes/notifications.js";
import User from "./models/User.js";
import Department from "./models/Department.js";
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET required. Set it in .env (e.g. JWT_SECRET=your-secret).");
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/v1", authRoutes);
app.use("/api/v1", caseRoutes);
app.use("/api/v1", employeeRoutes);
app.use("/api/v1", departmentRoutes);
app.use("/api/v1", notificationRoutes);
app.get("/", (req, res) => {
  res.json({ status: "HCM Backend running" });
});

app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message || "Server error";
  if (process.env.NODE_ENV !== "test") {
    console.error("Error:", err.message || err);
  }
  res.status(status).json({ message });
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

  const deptCount = await Department.countDocuments();
  if (deptCount === 0) {
    const seedDepartments = [
      { name: "Minister's Office", state: "Central", ministerName: "Shri Gajendra Singh Shekhawat" },
      { name: "Minister of State's Office", state: "Central", ministerName: "Smt. Gajala Yogita Rajput" },
      { name: "Secretary's Office", state: "Central", ministerName: "Shri Arunish Chawla" },
      { name: "Additional Secretary's Office", state: "Central", ministerName: "Shri Rajesh Ranjan" },
      { name: "Joint Secretary (Academy & Culture)", state: "Central", ministerName: "Ms. Nirupama Kotru" },
      { name: "Joint Secretary (Museum & Library)", state: "Central", ministerName: "Shri M. Manikandan" },
      { name: "Joint Secretary (Media & Film)", state: "Central", ministerName: "Ms. K. Nandini Singla" },
      { name: "Financial Advisor", state: "Central", ministerName: "Dr. B.K. Sinha" },
      { name: "Archaeological Survey of India (ASI)", state: "Central", ministerName: "Director General" },
      { name: "National Archives of India", state: "Central", ministerName: "Director General" },
      { name: "National Museum", state: "Central", ministerName: "Director General" },
      { name: "National Gallery of Modern Art (NGMA)", state: "Central", ministerName: "Director General" },
      { name: "Anthropological Survey of India (AnSI)", state: "Central", ministerName: "Director General" },
      { name: "National Library, Kolkata", state: "West Bengal", ministerName: "Director General" },
      { name: "Indira Gandhi National Centre for the Arts (IGNCA)", state: "Central", ministerName: "Member Secretary" },
      { name: "Sahitya Akademi", state: "Central", ministerName: "Secretary" },
      { name: "Sangeet Natak Akademi", state: "Central", ministerName: "Secretary" },
      { name: "Lalit Kala Akademi", state: "Central", ministerName: "Secretary" },
      { name: "National School of Drama (NSD)", state: "Central", ministerName: "Director" },
      { name: "Centre for Cultural Resources & Training (CCRT)", state: "Central", ministerName: "Director" },
      { name: "Central Reference Library", state: "West Bengal", ministerName: "Director" },
      { name: "Zonal Cultural Centres", state: "Central", ministerName: "Director" },
      { name: "National Council of Science Museums (NCSM)", state: "Central", ministerName: "Director General" },
      { name: "Gandhi Smriti & Darshan Samiti", state: "Central", ministerName: "Director" },
      { name: "Rampur Raza Library", state: "Uttar Pradesh", ministerName: "Director" },
      { name: "Khuda Bakhsh Oriental Library", state: "Bihar", ministerName: "Director" },
      { name: "Raja Ram Mohan Roy Library Foundation", state: "West Bengal", ministerName: "Director" },
      { name: "Central Institute of Buddhist Studies", state: "Ladakh", ministerName: "Director" },
      { name: "Central University of Tibetan Studies", state: "Uttar Pradesh", ministerName: "Vice-Chancellor" },
      { name: "Nav Nalanda Mahavihara", state: "Bihar", ministerName: "Director" },
      { name: "National Mission on Libraries", state: "Central", ministerName: "Mission Director" },
      { name: "Central Institute of Higher Tibetan Studies", state: "Uttar Pradesh", ministerName: "Director" },
    ];
    await Department.insertMany(seedDepartments);
    console.log(`Seeded ${seedDepartments.length} departments (Ministry of Culture)`);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err.message);
  process.exit(1);
});




