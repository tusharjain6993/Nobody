import initSqlJs from "sql.js";
import { ADMIN_ROLES, MASTER_ADMIN_ROLE, getDepartmentOwner, getRoleLabel } from "../constants/adminWorkflow";

let db = null;
let dbPromise = null;

export function getDb() {
  if (db) return Promise.resolve(db);
  if (!dbPromise) {
    dbPromise = initSqlJs({
      locateFile: () => "/sql-wasm.wasm",
    }).then((SQL) => {
      db = new SQL.Database();
      runSchema();
      runSeeds();
      return db;
    });
  }
  return dbPromise;
}

function runSchema() {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    aadhaar TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    citizenUniqueId TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'citizen',
    isVerified INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseId TEXT UNIQUE NOT NULL,
    citizenId INTEGER NOT NULL,
    citizenSnapshot TEXT,
    purpose TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Grievance',
    department TEXT NOT NULL,
    assignedAdminRole TEXT NOT NULL,
    currentAdminRole TEXT NOT NULL,
    currentAdminName TEXT NOT NULL,
    details TEXT,
    urgency TEXT DEFAULT 'MEDIUM',
    documents TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    reviewNote TEXT,
    resolvedWithoutMeeting INTEGER DEFAULT 0,
    schedule TEXT,
    meetingSummary TEXT,
    actionRequired TEXT,
    responsibleAuthority TEXT,
    closureRequestedAt TEXT,
    closureType TEXT DEFAULT '',
    ministerDecisionNote TEXT,
    reopenedCount INTEGER DEFAULT 0,
    escalationReason TEXT,
    isArchived INTEGER DEFAULT 0,
    isDeleted INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseId INTEGER NOT NULL,
    type TEXT NOT NULL,
    summary TEXT NOT NULL,
    happenedAt TEXT NOT NULL,
    createdByName TEXT DEFAULT 'Staff',
    createdAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseId INTEGER NOT NULL,
    comment TEXT NOT NULL,
    createdByRole TEXT NOT NULL,
    createdByName TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    ministerName TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    profileImg TEXT DEFAULT '',
    joinDate TEXT NOT NULL,
    salary TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caseId INTEGER,
    caseNumber TEXT DEFAULT '',
    department TEXT NOT NULL,
    title TEXT NOT NULL,
    assignedToName TEXT DEFAULT '',
    priority TEXT DEFAULT 'MEDIUM',
    dueDate TEXT,
    status TEXT DEFAULT 'PENDING',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    message TEXT NOT NULL,
    caseId INTEGER,
    type TEXT DEFAULT 'GENERAL',
    isRead INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT COLLATE NOCASE,
    phone TEXT,
    otp TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  )`);
}

function runSeeds() {
  const now = new Date().toISOString();

  for (const role of ADMIN_ROLES) {
    db.run(
      `INSERT INTO users (name,email,phone,gender,age,aadhaar,password,role,isVerified,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
      [
        `${role.label} Admin`,
        role.email,
        `90000000${String(Math.floor(Math.random() * 90) + 10)}`,
        "MALE",
        42,
        String(Math.floor(100000000000 + Math.random() * 899999999999)),
        role.password,
        role.id,
        now,
        now,
      ]
    );
  }

  db.run(
    `INSERT INTO users (name,email,phone,gender,age,aadhaar,password,role,isVerified,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
    [
      MASTER_ADMIN_ROLE.label,
      MASTER_ADMIN_ROLE.email,
      "9555555555",
      "FEMALE",
      50,
      "888877776666",
      MASTER_ADMIN_ROLE.password,
      MASTER_ADMIN_ROLE.id,
      now,
      now,
    ]
  );

  db.run(
    `INSERT INTO users (name,email,phone,gender,age,aadhaar,password,citizenUniqueId,role,isVerified,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`,
    ["Citizen User", "citizen@test.com", "9876543210", "MALE", 30, "123412341234", "test123", "CTZ-HP-000001", "citizen", now, now]
  );

  db.run(
    `INSERT INTO users (name,email,phone,gender,age,aadhaar,password,citizenUniqueId,role,isVerified,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`,
    ["Aman Sogani", "amanmathssogani@gmail.com", "9876543215", "MALE", 25, "345678901234", "aman123", "CTZ-HP-000002", "citizen", now, now]
  );

  const departments = [
    ["Minister's Office", "Central", "Shri Gajendra Singh Shekhawat"],
    ["Minister of State's Office", "Central", "Smt. Gajala Yogita Rajput"],
    ["Secretary's Office", "Central", "Shri Arunish Chawla"],
    ["Additional Secretary's Office", "Central", "Shri Rajesh Ranjan"],
    ["Joint Secretary (Academy & Culture)", "Central", "Ms. Nirupama Kotru"],
    ["Joint Secretary (Museum & Library)", "Central", "Shri M. Manikandan"],
    ["Joint Secretary (Media & Film)", "Central", "Ms. K. Nandini Singla"],
    ["Financial Advisor", "Central", "Dr. B.K. Sinha"],
    ["Archaeological Survey of India (ASI)", "Central", "Director General"],
    ["National Archives of India", "Central", "Director General"],
    ["National Museum", "Central", "Director General"],
    ["National Gallery of Modern Art (NGMA)", "Central", "Director General"],
    ["Anthropological Survey of India (AnSI)", "Central", "Director General"],
    ["National Library, Kolkata", "West Bengal", "Director General"],
    ["Indira Gandhi National Centre for the Arts (IGNCA)", "Central", "Member Secretary"],
    ["Sahitya Akademi", "Central", "Secretary"],
    ["Sangeet Natak Akademi", "Central", "Secretary"],
    ["Lalit Kala Akademi", "Central", "Secretary"],
    ["National School of Drama (NSD)", "Central", "Director"],
    ["Centre for Cultural Resources & Training (CCRT)", "Central", "Director"],
    ["Central Reference Library", "West Bengal", "Director"],
    ["Zonal Cultural Centres", "Central", "Director"],
    ["National Council of Science Museums (NCSM)", "Central", "Director General"],
    ["Gandhi Smriti & Darshan Samiti", "Central", "Director"],
    ["Rampur Raza Library", "Uttar Pradesh", "Director"],
    ["Khuda Bakhsh Oriental Library", "Bihar", "Director"],
    ["Raja Ram Mohan Roy Library Foundation", "West Bengal", "Director"],
    ["Central Institute of Buddhist Studies", "Ladakh", "Director"],
    ["Central University of Tibetan Studies", "Uttar Pradesh", "Vice-Chancellor"],
    ["Nav Nalanda Mahavihara", "Bihar", "Director"],
    ["National Mission on Libraries", "Central", "Mission Director"],
    ["Central Institute of Higher Tibetan Studies", "Uttar Pradesh", "Director"],
  ];

  for (const [name, state, ministerName] of departments) {
    db.run(
      `INSERT INTO departments (name,state,ministerName,createdAt,updatedAt) VALUES (?,?,?,?,?)`,
      [name, state, ministerName, now, now]
    );
  }

  const departmentRows = departments.map(([name]) => ({ name }));
  seedCases(now, departmentRows);
}

function seedCases(now, departments) {
  const citizen1 = 6;
  const citizen2 = 7;
  const sampleCases = [
    {
      caseId: "HP-CASE-000001",
      citizenId: citizen1,
      citizenSnapshot: {
        name: "Citizen User",
        email: "citizen@test.com",
        phone: "9876543210",
        aadhaar: "123412341234",
        gender: "MALE",
        age: 30,
      },
      purpose: "Scholarship payment is pending",
      category: "Education",
      department: departments[0].name,
      details: "The scholarship portal shows approved but the amount was not credited.",
      urgency: "HIGH",
      status: "SUBMITTED",
      reviewNote: "",
    },
    {
      caseId: "HP-CASE-000002",
      citizenId: citizen2,
      citizenSnapshot: {
        name: "Aman Sogani",
        email: "amanmathssogani@gmail.com",
        phone: "9876543215",
        aadhaar: "345678901234",
        gender: "MALE",
        age: 25,
      },
      purpose: "Need correction in university certificate",
      category: "University",
      department: departments[10].name,
      details: "Spelling mistake in the degree certificate is blocking job verification.",
      urgency: "MEDIUM",
      status: "APPROVED",
      reviewNote: "Documents checked and case approved for handling.",
      meeting: {
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        slot: "11:00 AM - 11:30 AM",
        type: "In Person",
        venue: "Kartavya Bhawan",
      },
    },
    {
      caseId: "HP-CASE-000003",
      citizenId: citizen1,
      citizenSnapshot: {
        name: "Citizen User",
        email: "citizen@test.com",
        phone: "9876543210",
        aadhaar: "123412341234",
        gender: "MALE",
        age: 30,
      },
      purpose: "Library grant issue resolved, closure pending",
      category: "Library",
      department: departments[22].name,
      details: "Grant documentation has been completed and the admin has requested closure.",
      urgency: "LOW",
      status: "CLOSURE_PENDING_MINISTER",
      reviewNote: "Closure request sent to minister after final review.",
      meetingSummary: "Citizen confirmed the issue has been resolved.",
      actionRequired: "Release final acknowledgement.",
      responsibleAuthority: "Department finance desk",
      closureRequestedAt: now,
      closureType: "CLOSURE",
    },
    {
      caseId: "HP-CASE-000004",
      citizenId: citizen2,
      citizenSnapshot: {
        name: "Aman Sogani",
        email: "amanmathssogani@gmail.com",
        phone: "9876543215",
        aadhaar: "345678901234",
        gender: "MALE",
        age: 25,
      },
      purpose: "Complaint already handled locally",
      category: "Public Service",
      department: departments[28].name,
      details: "The complaint was already solved by the local office before portal review.",
      urgency: "MEDIUM",
      status: "REJECTION_PENDING_MINISTER",
      reviewNote: "Admin recommends rejection because the issue is already resolved.",
      closureRequestedAt: now,
      closureType: "REJECTION",
    },
  ];

  sampleCases.forEach((item) => {
    const owner = getDepartmentOwner(departments, item.department);
    const adminLabel = owner?.roleLabel || "Director";
    const assignedAdminRole = owner?.roleId || "director";
    const schedule = item.meeting ? JSON.stringify(item.meeting) : null;
    db.run(
      `INSERT INTO cases (
        caseId,citizenId,citizenSnapshot,purpose,category,department,assignedAdminRole,currentAdminRole,currentAdminName,
        details,urgency,status,reviewNote,resolvedWithoutMeeting,schedule,meetingSummary,actionRequired,responsibleAuthority,
        closureRequestedAt,closureType,ministerDecisionNote,reopenedCount,escalationReason,isArchived,isDeleted,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        item.caseId,
        item.citizenId,
        JSON.stringify(item.citizenSnapshot),
        item.purpose,
        item.category,
        item.department,
        assignedAdminRole,
        assignedAdminRole,
        adminLabel,
        item.details,
        item.urgency,
        item.status,
        item.reviewNote || "",
        item.status === "RESOLVED_WITHOUT_MEETING" ? 1 : 0,
        schedule,
        item.meetingSummary || "",
        item.actionRequired || "",
        item.responsibleAuthority || "",
        item.closureRequestedAt || null,
        item.closureType || "",
        "",
        0,
        "",
        0,
        0,
        now,
        now,
      ]
    );
  });

  db.run(
    `INSERT INTO communications (caseId,type,summary,happenedAt,createdByName,createdAt) VALUES (?,?,?,?,?,?)`,
    [2, "EMAIL", "Citizen asked for the next available correction meeting date.", now, "Director General Admin", now]
  );
  db.run(
    `INSERT INTO communications (caseId,type,summary,happenedAt,createdByName,createdAt) VALUES (?,?,?,?,?,?)`,
    [3, "CALL", "Citizen confirmed receipt of the revised grant sanction letter.", now, "Director General Admin", now]
  );
  db.run(
    `INSERT INTO comments (caseId,comment,createdByRole,createdByName,createdAt) VALUES (?,?,?,?,?)`,
    [2, "All uploaded documents are valid. Meeting can be held if needed.", "director_general", "Director General Admin", now]
  );
  db.run(
    `INSERT INTO comments (caseId,comment,createdByRole,createdByName,createdAt) VALUES (?,?,?,?,?)`,
    [3, "Closure summary is complete and ready for minister review.", "director_general", "Director General Admin", now]
  );

  const notifications = [
    [citizen1, "Your case HP-CASE-000001 was routed to the Director.", 1, "CASE_CREATED"],
    [citizen2, "Your case HP-CASE-000002 was approved by the Director General.", 2, "STATUS_CHANGE"],
    [citizen1, "Closure request for HP-CASE-000003 is awaiting minister review.", 3, "STATUS_CHANGE"],
    [5, "A rejection request for HP-CASE-000004 needs minister review.", 4, "STATUS_CHANGE"],
  ];

  notifications.forEach(([userId, message, caseId, type]) => {
    db.run(
      `INSERT INTO notifications (userId,message,caseId,type,isRead,createdAt) VALUES (?,?,?,?,0,?)`,
      [userId, message, caseId, type, now]
    );
  });
}

export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (row.id !== undefined) row._id = String(row.id);
    results.push(row);
  }
  stmt.free();
  return results;
}

export function queryOne(sql, params = []) {
  return queryAll(sql, params)[0] || null;
}

export function execute(sql, params = []) {
  db.run(sql, params);
}

export function lastInsertId() {
  return db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0];
}
