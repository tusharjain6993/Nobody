import initSqlJs from "sql.js";

const DB_STORAGE_KEY = "hcm_demo_sqlite_v3";
const DB_SCHEMA_VERSION_KEY = "hcm_demo_schema_version";
const DB_SCHEMA_VERSION = "13";
const DB_SEED_PACK_KEY = "hcm_demo_seed_pack";
const DB_SNAPSHOT_INDEX_KEY = "hcm_demo_snapshot_index";
const DB_SNAPSHOT_PREFIX = "hcm_demo_snapshot_";
const MAX_PERSIST_BYTES = 4.5 * 1024 * 1024;

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

function serializeDb() {
  if (!db) return "";
  return toBase64(db.export());
}

function persistDb() {
  if (!db) return;
  const snapshot = serializeDb();
  if (snapshot.length > MAX_PERSIST_BYTES) {
    throw new Error("Local demo storage is full. Remove large attachments or reset/import a smaller dataset.");
  }
  localStorage.setItem(DB_STORAGE_KEY, snapshot);
  localStorage.setItem(DB_SCHEMA_VERSION_KEY, DB_SCHEMA_VERSION);
}

function clearPersistedDb() {
  localStorage.removeItem(DB_STORAGE_KEY);
  localStorage.removeItem(DB_SCHEMA_VERSION_KEY);
}

function getStoredSeedPack() {
  return localStorage.getItem(DB_SEED_PACK_KEY) || "default";
}

function setStoredSeedPack(seedPack) {
  localStorage.setItem(DB_SEED_PACK_KEY, seedPack || "default");
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
      ["users", "failedLoginAttempts"],
      ["users", "lockedUntil"],
      ["meeting_requests", "attachments"],
      ["meeting_requests", "meetingDocket"],
      ["meeting_requests", "priority"],
      ["meeting_requests", "priorityReason"],
      ["meeting_requests", "statusReason"],
      ["meeting_requests", "executionStatus"],
      ["meeting_requests", "assignedAdminUserId"],
      ["complaints", "resolutionDocs"],
      ["complaints", "resolutionSummary"],
      ["complaints", "statusReason"],
      ["complaints", "reopenedCount"],
      ["complaints", "complaintDate"],
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
  runSeeds(getStoredSeedPack());
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

export function resetDemoDatabaseWithSeed(seedPack = "default") {
  setStoredSeedPack(seedPack);
  resetDemoDatabase();
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
    lastLoginAt TEXT DEFAULT '',
    failedLoginAttempts INTEGER NOT NULL DEFAULT 0,
    lockedUntil TEXT DEFAULT '',
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
    attachments TEXT NOT NULL DEFAULT '[]',
    attachmentName TEXT DEFAULT '',
    attachmentType TEXT DEFAULT '',
    attachmentData TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'submitted',
    verificationOutcome TEXT DEFAULT '',
    rejectReason TEXT DEFAULT '',
    scheduleDate TEXT DEFAULT '',
    scheduleTime TEXT DEFAULT '',
    scheduleLocation TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    priorityReason TEXT DEFAULT '',
    visitorId TEXT DEFAULT '',
    meetingDocket TEXT DEFAULT '',
    adminNotes TEXT DEFAULT '',
    statusReason TEXT DEFAULT '',
    executionStatus TEXT NOT NULL DEFAULT 'pending',
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
    complaintDate TEXT DEFAULT '',
    complaintLocation TEXT DEFAULT '',
    complaintType TEXT DEFAULT '',
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
    statusReason TEXT DEFAULT '',
    reopenedCount INTEGER NOT NULL DEFAULT 0,
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

function insertUsers(now) {
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
        name,email,password,aadhaar,phonePrimary,phoneSecondary,phoneTertiary,phoneNumbers,age,gender,pinCode,state,city,mpName,photoName,photoType,photoData,citizenId,role,department,isVerified,lastLoginAt,failedLoginAttempts,lockedUntil,createdAt,updatedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        "",
        0,
        "",
        now,
        now,
      ]
    );
  });
}

function insertDirectory(now) {
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
}

function insertDefaultOperationalData(now) {
  db.run(
    `INSERT INTO meeting_requests (
      requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,assignedAdminUserId,assignedAdminName,attachmentName,attachmentType,attachmentData,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,priority,priorityReason,visitorId,meetingDocket,adminNotes,statusReason,executionStatus,escalatedFromComplaintId,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "MREQ-000001",
      6,
      JSON.stringify({ name: "Citizen User", citizenId: "CTZ-HP-000001", aadhaar: "****-****-1234", phoneNumbers: ["9876543210"] }),
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
      "HIGH",
      "Scholarship release deadline falls within the next 72 hours.",
      "VIS-2026-001",
      "DOC-2026-001",
      "Carry scholarship application copy.",
      "Admin approved and scheduled after verification.",
      "pending",
      null,
      now,
      now,
    ]
  );

  db.run(
    `INSERT INTO complaints (
      complaintId,citizenId,citizenSnapshot,title,details,attachments,resolutionDocs,status,assignedAdminUserId,assignedAdminName,referralAdminUserId,department,officerName,officerContact,manualContact,callScheduledAt,callOutcome,escalatedMeetingRequestId,statusReason,reopenedCount,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "COMP-000001",
      7,
      JSON.stringify({ name: "Aman Sogani", citizenId: "CTZ-HP-000002", aadhaar: "****-****-1234", phoneNumbers: ["9876543215"] }),
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
      "Awaiting admin assignment from the common pool.",
      0,
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
      5,
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

function insertBacklogScenario(now) {
  db.run(
    `INSERT INTO complaints (
      complaintId,citizenId,citizenSnapshot,title,details,complaintDate,complaintLocation,complaintType,attachments,resolutionDocs,status,assignedAdminUserId,assignedAdminName,referralAdminUserId,department,officerName,officerContact,manualContact,callScheduledAt,callOutcome,escalatedMeetingRequestId,statusReason,reopenedCount,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "COMP-000002",
      6,
      JSON.stringify({ name: "Citizen User", citizenId: "CTZ-HP-000001", aadhaar: "****-****-1234", phoneNumbers: ["9876543210"] }),
      "Water connection file pending in district office",
      "The file has been pending despite multiple visits to the district office.",
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      "Jaipur Collectorate",
      "Public Grievance",
      JSON.stringify([]),
      JSON.stringify([]),
      "followup_in_progress",
      1,
      "Admin Demo",
      1,
      "Public Grievance Cell",
      "Karan Malhotra",
      "9811100004",
      "",
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      "Department acknowledged delay and requested 3 more working days.",
      null,
      "Follow-up call completed; waiting for departmental action.",
      0,
      now,
      now,
    ]
  );

  db.run(
    `INSERT INTO meeting_requests (
      requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,assignedAdminUserId,assignedAdminName,attachments,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleLocation,priority,priorityReason,visitorId,meetingDocket,adminNotes,statusReason,executionStatus,escalatedFromComplaintId,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      "MREQ-000002",
      7,
      JSON.stringify({ name: "Aman Sogani", citizenId: "CTZ-HP-000002", aadhaar: "****-****-1234", phoneNumbers: ["9876543215"] }),
      "Urgent review of tourism permit blockage",
      2,
      "Priya Sharma",
      2,
      "Priya Sharma",
      JSON.stringify([]),
      "under_review",
      "Citizen confirmed documentation and district office references during verification.",
      "",
      "",
      "",
      "",
      "HIGH",
      "Investor timeline and district tourism season impact require minister attention.",
      "",
      "",
      "Escalated from complaint due to repeated departmental delays.",
      "Verification completed; admin decision pending.",
      "pending",
      1,
      now,
      now,
    ]
  );
}

function runSeeds(seedPack = "default") {
  const now = new Date().toISOString();
  insertUsers(now);
  insertDirectory(now);
  insertDefaultOperationalData(now);
  if (seedPack === "backlog") {
    insertBacklogScenario(now);
  }
}

export function listDemoSeedPacks() {
  return [
    { id: "default", label: "Default Demo", description: "Balanced seed data with one scheduled meeting and one open complaint." },
    { id: "backlog", label: "Backlog Scenario", description: "Adds a backlog complaint and a high-priority escalated meeting under review." },
  ];
}

export function exportDemoDatabase() {
  if (!db) return null;
  return {
    schemaVersion: DB_SCHEMA_VERSION,
    seedPack: getStoredSeedPack(),
    exportedAt: new Date().toISOString(),
    snapshot: serializeDb(),
  };
}

export async function importDemoDatabase(payload) {
  const snapshot = payload?.snapshot;
  if (!snapshot || typeof snapshot !== "string") throw new Error("Import file does not contain a valid demo snapshot");
  localStorage.setItem(DB_STORAGE_KEY, snapshot);
  localStorage.setItem(DB_SCHEMA_VERSION_KEY, DB_SCHEMA_VERSION);
  setStoredSeedPack(payload?.seedPack || "default");
  db = null;
  dbPromise = null;
  await getDb();
}

function getSnapshotIndex() {
  try {
    return JSON.parse(localStorage.getItem(DB_SNAPSHOT_INDEX_KEY) || "[]");
  } catch {
    return [];
  }
}

function setSnapshotIndex(items) {
  localStorage.setItem(DB_SNAPSHOT_INDEX_KEY, JSON.stringify(items));
}

export function listDemoSnapshots() {
  return getSnapshotIndex();
}

export function saveDemoSnapshot(name) {
  if (!db) throw new Error("Database is not initialized");
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error("Snapshot name is required");
  const entry = {
    name: cleanName,
    savedAt: new Date().toISOString(),
    seedPack: getStoredSeedPack(),
  };
  localStorage.setItem(`${DB_SNAPSHOT_PREFIX}${cleanName}`, JSON.stringify({ ...entry, snapshot: serializeDb() }));
  const nextIndex = getSnapshotIndex().filter((item) => item.name !== cleanName);
  nextIndex.unshift(entry);
  setSnapshotIndex(nextIndex.slice(0, 12));
  return entry;
}

export async function restoreDemoSnapshot(name) {
  const raw = localStorage.getItem(`${DB_SNAPSHOT_PREFIX}${name}`);
  if (!raw) throw new Error("Snapshot not found");
  const parsed = JSON.parse(raw);
  await importDemoDatabase(parsed);
}

export function deleteDemoSnapshot(name) {
  localStorage.removeItem(`${DB_SNAPSHOT_PREFIX}${name}`);
  setSnapshotIndex(getSnapshotIndex().filter((item) => item.name !== name));
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
