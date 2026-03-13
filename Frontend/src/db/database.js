import initSqlJs from "sql.js";

const DB_STORAGE_KEY = "hcm_demo_sqlite_v3";
const DB_SCHEMA_VERSION_KEY = "hcm_demo_schema_version";
const DB_SCHEMA_VERSION = "10";

let db = null;
let dbPromise = null;

function toBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function persistDb() {
  if (!db) return;
  const bytes = db.export();
  localStorage.setItem(DB_STORAGE_KEY, toBase64(bytes));
  localStorage.setItem(DB_SCHEMA_VERSION_KEY, DB_SCHEMA_VERSION);
}

function clearPersistedDb() {
  localStorage.removeItem(DB_STORAGE_KEY);
  localStorage.removeItem(DB_SCHEMA_VERSION_KEY);
}

function hasColumn(tableName, columnName) {
  const rows = db.exec(`PRAGMA table_info(${tableName})`);
  if (!rows?.[0]?.values) return false;
  return rows[0].values.some((row) => row[1] === columnName);
}

function isSchemaCompatible() {
  try {
    const requiredChecks = [
      ["users", "phoneNumbers"],
      ["users", "citizenId"],
      ["users", "pinCode"],
      ["users", "photoData"],
      ["meeting_requests", "meetingDocket"],
      ["meeting_requests", "assignedAdminUserId"],
      ["complaints", "resolutionDocs"],
      ["complaints", "resolutionSummary"],
      ["calendar_events", "productivityScore"],
      ["calendar_events", "documents"],
      ["notifications", "link"],
    ];
    return requiredChecks.every(([table, column]) => hasColumn(table, column));
  } catch {
    return false;
  }
}

function initializeFreshDb() {
  runSchema();
  runSeeds();
  persistDb();
}

export async function getDb() {
  if (db) return db;
  if (!dbPromise) {
    const wasmPath = typeof window === "undefined"
      ? new URL("../../public/sql-wasm.wasm", import.meta.url).pathname
      : "/sql-wasm.wasm";
    dbPromise = initSqlJs({
      locateFile: () => wasmPath,
    }).then((SQL) => {
      const snapshot = localStorage.getItem(DB_STORAGE_KEY);
      const savedVersion = localStorage.getItem(DB_SCHEMA_VERSION_KEY);

      if (snapshot && savedVersion === DB_SCHEMA_VERSION) {
        try {
          db = new SQL.Database(fromBase64(snapshot));
          if (!isSchemaCompatible()) {
            clearPersistedDb();
            db = new SQL.Database();
            initializeFreshDb();
          }
        } catch {
          clearPersistedDb();
          db = new SQL.Database();
          initializeFreshDb();
        }
      } else {
        clearPersistedDb();
        db = new SQL.Database();
        initializeFreshDb();
      }
      return db;
    });
  }
  return dbPromise;
}

export function resetDemoDatabase() {
  db = null;
  dbPromise = null;
  clearPersistedDb();
}

function runSchema() {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL DEFAULT '',
    aadhaar TEXT UNIQUE,
    phonePrimary TEXT,
    phoneSecondary TEXT DEFAULT '',
    phoneTertiary TEXT DEFAULT '',
    phoneNumbers TEXT NOT NULL DEFAULT '[]',
    age INTEGER,
    gender TEXT DEFAULT '',
    pinCode TEXT DEFAULT '',
    state TEXT DEFAULT '',
    city TEXT DEFAULT '',
    mpName TEXT DEFAULT '',
    photoName TEXT DEFAULT '',
    photoType TEXT DEFAULT '',
    photoData TEXT DEFAULT '',
    citizenId TEXT UNIQUE,
    role TEXT NOT NULL,
    department TEXT DEFAULT '',
    isVerified INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    ministry TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE department_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT NOT NULL,
    officerName TEXT NOT NULL,
    designation TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE meeting_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requestId TEXT NOT NULL UNIQUE,
    citizenId INTEGER NOT NULL,
    citizenSnapshot TEXT NOT NULL,
    purpose TEXT NOT NULL,
    referralAdminUserId INTEGER,
    referralAdminName TEXT NOT NULL,
    assignedAdminUserId INTEGER,
    assignedAdminName TEXT DEFAULT '',
    attachmentName TEXT DEFAULT '',
    attachmentType TEXT DEFAULT '',
    attachmentData TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'submitted',
    verificationOutcome TEXT DEFAULT '',
    rejectReason TEXT DEFAULT '',
    scheduleDate TEXT DEFAULT '',
    scheduleTime TEXT DEFAULT '',
    scheduleLocation TEXT DEFAULT '',
    visitorId TEXT DEFAULT '',
    meetingDocket TEXT DEFAULT '',
    adminNotes TEXT DEFAULT '',
    escalatedFromComplaintId INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaintId TEXT NOT NULL UNIQUE,
    citizenId INTEGER NOT NULL,
    citizenSnapshot TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    attachments TEXT NOT NULL DEFAULT '[]',
    resolutionDocs TEXT NOT NULL DEFAULT '[]',
    resolutionSummary TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pooled',
    assignedAdminUserId INTEGER,
    assignedAdminName TEXT DEFAULT '',
    referralAdminUserId INTEGER,
    department TEXT DEFAULT '',
    officerName TEXT DEFAULT '',
    officerContact TEXT DEFAULT '',
    manualContact TEXT DEFAULT '',
    callScheduledAt TEXT DEFAULT '',
    callOutcome TEXT DEFAULT '',
    escalatedMeetingRequestId INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT NOT NULL,
    entityId INTEGER NOT NULL,
    action TEXT NOT NULL,
    notes TEXT DEFAULT '',
    createdByUserId INTEGER,
    createdByName TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    eventType TEXT NOT NULL,
    scheduleAt TEXT NOT NULL,
    endAt TEXT NOT NULL,
    durationMinutes INTEGER NOT NULL DEFAULT 0,
    department TEXT DEFAULT '',
    mediaFolder TEXT DEFAULT '',
    photos TEXT NOT NULL DEFAULT '[]',
    documents TEXT NOT NULL DEFAULT '[]',
    videoLink TEXT DEFAULT '',
    attendanceStatus TEXT NOT NULL DEFAULT 'planned',
    attendedAt TEXT DEFAULT '',
    classification TEXT DEFAULT '',
    participationRole TEXT NOT NULL DEFAULT 'Attendee',
    portfolio TEXT NOT NULL DEFAULT 'Neither',
    productivityScore REAL NOT NULL DEFAULT 0,
    createdByUserId INTEGER,
    createdByName TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  )`);
}

function runSeeds() {
  const now = new Date().toISOString();

  const seedUsers = [
    {
      name: "Admin Demo",
      email: "admin@portal.gov",
      password: "admin123",
      role: "admin",
      department: "General Administration",
    },
    {
      name: "Priya Sharma",
      email: "priya.admin@portal.gov",
      password: "admin123",
      role: "admin",
      department: "Tourism Desk",
    },
    {
      name: "Arjun Mehta",
      email: "arjun.admin@portal.gov",
      password: "admin123",
      role: "admin",
      department: "Culture Affairs Desk",
    },
    {
      name: "Minister Demo",
      email: "minister@portal.gov",
      password: "minister123",
      role: "minister",
      department: "Minister Office",
    },
    {
      name: "DEO Demo",
      email: "deo@portal.gov",
      password: "deo123",
      role: "deo",
      department: "Calendar Cell",
    },
    {
      name: "Citizen User",
      email: "citizen@test.com",
      password: "",
      role: "citizen",
      aadhaar: "123412341234",
      citizenId: "CTZ-HP-000001",
      phoneNumbers: ["9876543210"],
      age: 32,
      gender: "Male",
      pinCode: "302001",
      state: "Rajasthan",
      city: "Jaipur",
      mpName: "Manju Sharma",
      department: "",
    },
    {
      name: "Aman Sogani",
      email: "amanmathssogani@gmail.com",
      password: "",
      role: "citizen",
      aadhaar: "345678901234",
      citizenId: "CTZ-HP-000002",
      phoneNumbers: ["9876543215"],
      age: 28,
      gender: "Male",
      pinCode: "110001",
      state: "Delhi",
      city: "New Delhi",
      mpName: "Bansuri Swaraj",
      department: "",
    },
  ];

  seedUsers.forEach((user) => {
    const phones = user.phoneNumbers || [];
    db.run(
      `INSERT INTO users (
        name,email,password,aadhaar,phonePrimary,phoneSecondary,phoneTertiary,phoneNumbers,age,gender,pinCode,state,city,mpName,photoName,photoType,photoData,citizenId,role,department,isVerified,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        user.name,
        user.email,
        user.password,
        user.aadhaar || null,
        phones[0] || "",
        phones[1] || "",
        phones[2] || "",
        JSON.stringify(phones),
        user.age || null,
        user.gender || "",
        user.pinCode || "",
        user.state || "",
        user.city || "",
        user.mpName || "",
        user.photoName || "",
        user.photoType || "",
        user.photoData || "",
        user.citizenId || null,
        user.role,
        user.department || "",
        1,
        now,
        now,
      ]
    );
  });

  const departments = [
    ["Culture Affairs Desk", "Culture"],
    ["Tourism Outreach Cell", "Tourism"],
    ["Heritage Preservation Division", "Culture"],
    ["Public Grievance Cell", "Administration"],
    ["Industry Partnerships Wing", "Tourism"],
  ];

  departments.forEach(([name, ministry]) => {
    db.run(
      "INSERT INTO departments (name,ministry,createdAt,updatedAt) VALUES (?,?,?,?)",
      [name, ministry, now, now]
    );
  });

  const contacts = [
    ["Culture Affairs Desk", "Neha Kapoor", "Section Officer", "9811100001", "neha.kapoor@gov.demo"],
    ["Tourism Outreach Cell", "Ravi Nair", "Deputy Director", "9811100002", "ravi.nair@gov.demo"],
    ["Heritage Preservation Division", "Sonal Gupta", "Nodal Officer", "9811100003", "sonal.gupta@gov.demo"],
    ["Public Grievance Cell", "Karan Malhotra", "Grievance Officer", "9811100004", "karan.malhotra@gov.demo"],
    ["Industry Partnerships Wing", "Aditi Verma", "Industry Liaison", "9811100005", "aditi.verma@gov.demo"],
  ];

  contacts.forEach((row) => {
    db.run(
      `INSERT INTO department_contacts (department,officerName,designation,phone,email,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,?)`,
      [...row, now, now]
    );
  });

  db.run(
    `INSERT INTO meeting_requests (
      requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,assignedAdminUserId,assignedAdminName,attachmentName,attachmentType,attachmentData,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,visitorId,meetingDocket,adminNotes,escalatedFromComplaintId,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "MREQ-000001",
      4,
      JSON.stringify({ name: "Citizen User", citizenId: "CTZ-HP-000001", aadhaar: "123412341234", phoneNumbers: ["9876543210", "9876500000"] }),
      "Discussion on cultural scholarship release",
      1,
      "Admin Demo",
      1,
      "Admin Demo",
      "",
      "",
      "",
      "scheduled",
      "Documents verified over a call with the applicant.",
      "",
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      "11:30",
      "North Block Meeting Room 3",
      "VIS-2026-001",
      "DOC-2026-001",
      "Carry scholarship application copy.",
      null,
      now,
      now,
    ]
  );

  db.run(
    `INSERT INTO complaints (
      complaintId,citizenId,citizenSnapshot,title,details,attachments,resolutionDocs,status,assignedAdminUserId,assignedAdminName,referralAdminUserId,department,officerName,officerContact,manualContact,callScheduledAt,callOutcome,escalatedMeetingRequestId,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "COMP-000001",
      5,
      JSON.stringify({ name: "Aman Sogani", citizenId: "CTZ-HP-000002", aadhaar: "345678901234", phoneNumbers: ["9876543215"] }),
      "Tourism permit approval delayed",
      "A district tourism permit has been pending for over six weeks without a response.",
      JSON.stringify([]),
      JSON.stringify([]),
      "pooled",
      null,
      "",
      2,
      "Tourism Outreach Cell",
      "",
      "",
      "",
      "",
      "",
      null,
      now,
      now,
    ]
  );

  db.run(
    `INSERT INTO calendar_events (
      title,details,eventType,scheduleAt,endAt,durationMinutes,department,mediaFolder,photos,documents,videoLink,attendanceStatus,attendedAt,classification,participationRole,portfolio,productivityScore,createdByUserId,createdByName,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "Heritage Museum Review",
      "Review of restoration progress and public accessibility work.",
      "Scheduled Meeting",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      90,
      "Heritage Preservation Division",
      "heritage/review-mar-2026",
      JSON.stringify([]),
      JSON.stringify([]),
      "",
      "attended",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      "Governance Work",
      "Chair",
      "Culture",
      9.1,
      3,
      "DEO Demo",
      now,
      now,
    ]
  );

  db.run(
    `INSERT INTO notifications (userId,type,message,link,isRead,createdAt) VALUES (?,?,?,?,0,?)`,
    [1, "Complaint Submitted", "A new complaint has entered the common complaint pool.", "/cases/complaint/1", now]
  );
}

export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (row.id !== undefined) row._id = String(row.id);
    rows.push(row);
  }
  stmt.free();
  return rows;
}

export function queryOne(sql, params = []) {
  return queryAll(sql, params)[0] || null;
}

export function execute(sql, params = []) {
  db.run(sql, params);
  persistDb();
}

export function lastInsertId() {
  return db.exec("SELECT last_insert_rowid()")[0]?.values?.[0]?.[0] || null;
}
