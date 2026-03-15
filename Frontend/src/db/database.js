import initSqlJs from "sql.js";

const DB_STORAGE_KEY = "hcm_demo_sqlite_v3";
const DB_SCHEMA_VERSION_KEY = "hcm_demo_schema_version";
const DB_SCHEMA_VERSION = "16";
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
      ["meeting_requests", "scheduleEndTime"],
      ["meeting_requests", "companions"],
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
    scheduleEndTime TEXT DEFAULT '',
    scheduleLocation TEXT DEFAULT '',
    companions TEXT NOT NULL DEFAULT '[]',
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

function nextInsertedId() {
  return db.exec("SELECT last_insert_rowid()")[0]?.values?.[0]?.[0] || null;
}

function maskSeedAadhaar(value = "") {
  const clean = String(value).replace(/\D/g, "");
  return clean.length === 12 ? `****-****-${clean.slice(-4)}` : value;
}

function dateShift(base, dayOffset, hour = 10, minute = 0) {
  const value = new Date(base);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

function dateOnly(base, dayOffset) {
  return dateShift(base, dayOffset, 10, 0).slice(0, 10);
}

function timeOnly(hour, minute = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function buildCitizenSeedUsers() {
  const base = [
    { name: "Citizen User", email: "citizen@test.com", aadhaar: "123412341234", phoneNumbers: ["9876543210"], age: 32, gender: "Male", pinCode: "302001", state: "Rajasthan", city: "Jaipur", mpName: "Manju Sharma" },
    { name: "Aman Sogani", email: "amanmathssogani@gmail.com", aadhaar: "345678901234", phoneNumbers: ["9876543215"], age: 28, gender: "Male", pinCode: "110001", state: "Delhi", city: "New Delhi", mpName: "Bansuri Swaraj" },
    { name: "Ananya Verma", email: "ananya.verma@demo.in", aadhaar: "456789012345", phoneNumbers: ["9876543220"], age: 35, gender: "Female", pinCode: "226001", state: "Uttar Pradesh", city: "Lucknow", mpName: "Rajnath Singh" },
    { name: "Rohit Patil", email: "rohit.patil@demo.in", aadhaar: "567890123456", phoneNumbers: ["9876543221"], age: 41, gender: "Male", pinCode: "400001", state: "Maharashtra", city: "Mumbai", mpName: "Arvind Sawant" },
    { name: "Minal Shah", email: "minal.shah@demo.in", aadhaar: "678901234567", phoneNumbers: ["9876543222"], age: 29, gender: "Female", pinCode: "380001", state: "Gujarat", city: "Ahmedabad", mpName: "Amit Shah" },
    { name: "Harpreet Kaur", email: "harpreet.kaur@demo.in", aadhaar: "789012345678", phoneNumbers: ["9876543223"], age: 33, gender: "Female", pinCode: "143001", state: "Punjab", city: "Amritsar", mpName: "Gurjeet Singh Aujla" },
    { name: "Naveen Yadav", email: "naveen.yadav@demo.in", aadhaar: "890123456789", phoneNumbers: ["9876543224"], age: 31, gender: "Male", pinCode: "122001", state: "Haryana", city: "Gurugram", mpName: "Rao Inderjit Singh" },
    { name: "Mehak Thakur", email: "mehak.thakur@demo.in", aadhaar: "901234567890", phoneNumbers: ["9876543225"], age: 26, gender: "Female", pinCode: "171001", state: "Himachal Pradesh", city: "Shimla", mpName: "Suresh Kumar Kashyap" },
    { name: "Deepak Rawat", email: "deepak.rawat@demo.in", aadhaar: "112233445566", phoneNumbers: ["9876543226"], age: 38, gender: "Male", pinCode: "248001", state: "Uttarakhand", city: "Dehradun", mpName: "Mala Rajya Laxmi Shah" },
    { name: "Sana Parveen", email: "sana.parveen@demo.in", aadhaar: "223344556677", phoneNumbers: ["9876543227"], age: 30, gender: "Female", pinCode: "800001", state: "Bihar", city: "Patna", mpName: "Ravi Shankar Prasad" },
    { name: "Abhishek Ekka", email: "abhishek.ekka@demo.in", aadhaar: "334455667788", phoneNumbers: ["9876543228"], age: 27, gender: "Male", pinCode: "834001", state: "Jharkhand", city: "Ranchi", mpName: "Sanjay Seth" },
    { name: "Tania Dutta", email: "tania.dutta@demo.in", aadhaar: "445566778899", phoneNumbers: ["9876543229"], age: 36, gender: "Female", pinCode: "700001", state: "West Bengal", city: "Kolkata", mpName: "Sudip Bandyopadhyay" },
    { name: "Sourav Mishra", email: "sourav.mishra@demo.in", aadhaar: "556677889900", phoneNumbers: ["9876543230"], age: 34, gender: "Male", pinCode: "751001", state: "Odisha", city: "Bhubaneswar", mpName: "Aparajita Sarangi" },
    { name: "Ishita Sahu", email: "ishita.sahu@demo.in", aadhaar: "667788990011", phoneNumbers: ["9876543231"], age: 25, gender: "Female", pinCode: "492001", state: "Chhattisgarh", city: "Raipur", mpName: "Sunil Kumar Soni" },
    { name: "Kunal Dubey", email: "kunal.dubey@demo.in", aadhaar: "778899001122", phoneNumbers: ["9876543232"], age: 43, gender: "Male", pinCode: "462001", state: "Madhya Pradesh", city: "Bhopal", mpName: "Pragya Singh Thakur" },
    { name: "Divya Hegde", email: "divya.hegde@demo.in", aadhaar: "889900112233", phoneNumbers: ["9876543233"], age: 29, gender: "Female", pinCode: "560001", state: "Karnataka", city: "Bengaluru", mpName: "P C Mohan" },
    { name: "Karthik Raman", email: "karthik.raman@demo.in", aadhaar: "990011223344", phoneNumbers: ["9876543234"], age: 37, gender: "Male", pinCode: "600001", state: "Tamil Nadu", city: "Chennai", mpName: "Dayanidhi Maran" },
    { name: "Niharika Reddy", email: "niharika.reddy@demo.in", aadhaar: "101112131415", phoneNumbers: ["9876543235"], age: 33, gender: "Female", pinCode: "500001", state: "Telangana", city: "Hyderabad", mpName: "Asaduddin Owaisi" },
    { name: "Sai Krishna", email: "sai.krishna@demo.in", aadhaar: "121314151617", phoneNumbers: ["9876543236"], age: 40, gender: "Male", pinCode: "520001", state: "Andhra Pradesh", city: "Vijayawada", mpName: "Kesineni Sivanath" },
    { name: "Aiswarya Menon", email: "aiswarya.menon@demo.in", aadhaar: "131415161718", phoneNumbers: ["9876543237"], age: 31, gender: "Female", pinCode: "695001", state: "Kerala", city: "Thiruvananthapuram", mpName: "Shashi Tharoor" },
  ];

  return base.map((item, index) => ({
    ...item,
    password: "",
    role: "citizen",
    department: "",
    citizenId: `CTZ-HP-${String(index + 1).padStart(6, "0")}`,
  }));
}

function buildCitizenSnapshot(citizen) {
  return JSON.stringify({
    name: citizen.name,
    citizenId: citizen.citizenId,
    aadhaar: maskSeedAadhaar(citizen.aadhaar),
    phoneNumbers: citizen.phoneNumbers,
    age: citizen.age,
    gender: citizen.gender,
    pinCode: citizen.pinCode,
    state: citizen.state,
    city: citizen.city,
    mpName: citizen.mpName,
  });
}

function insertUsers(now) {
  const staffUsers = [
    { name: "Admin Demo", email: "admin@portal.gov", password: "admin123", role: "admin", department: "General Administration" },
    { name: "Priya Sharma", email: "priya.admin@portal.gov", password: "admin123", role: "admin", department: "Tourism Desk" },
    { name: "Arjun Mehta", email: "arjun.admin@portal.gov", password: "admin123", role: "admin", department: "Culture Affairs Desk" },
    { name: "Minister Demo", email: "minister@portal.gov", password: "minister123", role: "minister", department: "Minister Office" },
    { name: "DEO Demo", email: "deo@portal.gov", password: "deo123", role: "deo", department: "Calendar Cell" },
  ];
  const citizenUsers = buildCitizenSeedUsers();
  const seedUsers = [...staffUsers, ...citizenUsers];

  seedUsers.forEach((user, index) => {
    const phones = user.phoneNumbers || [];
    const id = index + 1;
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
    user.id = id;
  });

  return {
    admins: staffUsers.filter((item) => item.role === "admin"),
    minister: staffUsers.find((item) => item.role === "minister"),
    deo: staffUsers.find((item) => item.role === "deo"),
    citizens: citizenUsers,
  };
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

function insertSeedActivityLog(entityType, entityId, action, notes, user, createdAt) {
  db.run(
    "INSERT INTO activity_logs (entityType,entityId,action,notes,createdByUserId,createdByName,createdAt) VALUES (?,?,?,?,?,?,?)",
    [entityType, Number(entityId), action, notes || "", user?.id || null, user?.name || "System", createdAt]
  );
}

function insertSeedNotification(userId, type, message, link, createdAt, isRead = 0) {
  db.run(
    "INSERT INTO notifications (userId,type,message,link,isRead,createdAt) VALUES (?,?,?,?,?,?)",
    [Number(userId), type, message, link || "", isRead, createdAt]
  );
}

function insertComplaintRecord(record) {
  db.run(
    `INSERT INTO complaints (
      complaintId,citizenId,citizenSnapshot,title,details,complaintDate,complaintLocation,complaintType,attachments,resolutionDocs,resolutionSummary,status,assignedAdminUserId,assignedAdminName,referralAdminUserId,department,officerName,officerContact,manualContact,callScheduledAt,callOutcome,escalatedMeetingRequestId,statusReason,reopenedCount,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      record.complaintId,
      record.citizenId,
      record.citizenSnapshot,
      record.title,
      record.details,
      record.complaintDate || "",
      record.complaintLocation || "",
      record.complaintType || "",
      JSON.stringify(record.attachments || []),
      JSON.stringify(record.resolutionDocs || []),
      record.resolutionSummary || "",
      record.status,
      record.assignedAdminUserId || null,
      record.assignedAdminName || "",
      record.referralAdminUserId || null,
      record.department || "",
      record.officerName || "",
      record.officerContact || "",
      record.manualContact || "",
      record.callScheduledAt || "",
      record.callOutcome || "",
      record.escalatedMeetingRequestId || null,
      record.statusReason || "",
      record.reopenedCount || 0,
      record.createdAt,
      record.updatedAt,
    ]
  );
  return nextInsertedId();
}

function insertMeetingRecord(record) {
  db.run(
    `INSERT INTO meeting_requests (
      requestId,citizenId,citizenSnapshot,purpose,referralAdminUserId,referralAdminName,assignedAdminUserId,assignedAdminName,attachments,attachmentName,attachmentType,attachmentData,status,verificationOutcome,rejectReason,scheduleDate,scheduleTime,scheduleEndTime,scheduleLocation,priority,priorityReason,visitorId,meetingDocket,adminNotes,statusReason,executionStatus,escalatedFromComplaintId,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      record.requestId,
      record.citizenId,
      record.citizenSnapshot,
      record.purpose,
      record.referralAdminUserId || null,
      record.referralAdminName || "",
      record.assignedAdminUserId || null,
      record.assignedAdminName || "",
      JSON.stringify(record.attachments || []),
      "",
      "",
      "",
      record.status,
      record.verificationOutcome || "",
      record.rejectReason || "",
      record.scheduleDate || "",
      record.scheduleTime || "",
      record.scheduleEndTime || "",
      record.scheduleLocation || "",
      record.priority || "",
      record.priorityReason || "",
      record.visitorId || "",
      record.meetingDocket || "",
      record.adminNotes || "",
      record.statusReason || "",
      record.executionStatus || "pending",
      record.escalatedFromComplaintId || null,
      record.createdAt,
      record.updatedAt,
    ]
  );
  return nextInsertedId();
}

function insertCalendarEventRecord(record) {
  db.run(
    `INSERT INTO calendar_events (
      title,details,eventType,scheduleAt,endAt,durationMinutes,department,mediaFolder,photos,documents,videoLink,attendanceStatus,attendedAt,classification,participationRole,portfolio,productivityScore,createdByUserId,createdByName,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      record.title,
      record.details,
      record.eventType,
      record.scheduleAt,
      record.endAt,
      record.durationMinutes,
      record.department || "",
      record.mediaFolder || "",
      JSON.stringify(record.photos || []),
      JSON.stringify(record.documents || []),
      record.videoLink || "",
      record.attendanceStatus,
      record.attendedAt || "",
      record.classification || "",
      record.participationRole || "Attendee",
      record.portfolio || "Neither",
      record.productivityScore || 0,
      record.createdByUserId,
      record.createdByName,
      record.createdAt,
      record.updatedAt,
    ]
  );
  return nextInsertedId();
}

function seedComplaintLogs(record, complaintId, admin) {
  const submittedAt = record.createdAt;
  insertSeedActivityLog("complaint", complaintId, "Complaint submitted", record.title, { id: record.citizenId, name: JSON.parse(record.citizenSnapshot).name }, submittedAt);
  if (record.assignedAdminUserId) {
    insertSeedActivityLog("complaint", complaintId, "Complaint assigned", `Assigned to ${record.assignedAdminName}`, admin, dateShift(submittedAt, 0, 12, 0));
  }
  if (record.status === "department_contact_identified" || record.status === "call_scheduled" || record.status === "followup_in_progress" || record.status === "resolved" || record.status === "completed" || record.status === "escalated_to_admin_meeting") {
    insertSeedActivityLog("complaint", complaintId, "Department contact identified", `${record.department} / ${record.officerName || "Manual contact"}`, admin, dateShift(submittedAt, 1, 11, 30));
  }
  if (record.status === "call_scheduled" || record.status === "followup_in_progress" || record.status === "resolved" || record.status === "completed") {
    insertSeedActivityLog("complaint", complaintId, "Department call scheduled", record.callScheduledAt || "Follow-up call scheduled.", admin, dateShift(submittedAt, 2, 15, 0));
  }
  if (record.status === "followup_in_progress" || record.status === "resolved" || record.status === "completed") {
    insertSeedActivityLog("complaint", complaintId, "Department call outcome logged", record.callOutcome || "Department follow-up underway.", admin, dateShift(submittedAt, 3, 16, 0));
  }
  if (record.status === "resolved" || record.status === "completed") {
    insertSeedActivityLog("complaint", complaintId, "Complaint resolved", record.resolutionSummary || "Citizen issue resolved.", admin, dateShift(submittedAt, 4, 13, 0));
  }
  if (record.status === "completed") {
    insertSeedActivityLog("complaint", complaintId, "Case closed", "Complaint moved to completed archive.", admin, dateShift(submittedAt, 5, 10, 30));
  }
  if (record.status === "escalated_to_admin_meeting") {
    insertSeedActivityLog("complaint", complaintId, "Complaint escalated", "Escalated into a meeting workflow for minister-level hearing.", admin, dateShift(submittedAt, 4, 14, 0));
  }
  if (record.reopenedCount > 0) {
    insertSeedActivityLog("complaint", complaintId, "Complaint reopened", "Citizen requested renewed follow-up after partial resolution.", admin, dateShift(submittedAt, 6, 11, 15));
  }
}

function seedMeetingLogs(record, meetingId, admin, deo) {
  const citizenName = JSON.parse(record.citizenSnapshot).name;
  insertSeedActivityLog("meeting_request", meetingId, "Meeting submitted", record.purpose, { id: record.citizenId, name: citizenName }, record.createdAt);
  if (["approved", "verification_needed", "under_review", "scheduled"].includes(record.status)) {
    insertSeedActivityLog("meeting_request", meetingId, "Meeting approved", "Admin approved the meeting request for the next stage.", admin, dateShift(record.createdAt, 1, 11, 0));
  }
  if (["verification_needed", "under_review", "scheduled"].includes(record.status)) {
    insertSeedActivityLog("meeting_request", meetingId, "Verification requested", record.priority ? `Priority tagged as ${record.priority}.` : "Sent to DEO verification desk.", admin, dateShift(record.createdAt, 2, 14, 0));
  }
  if (["under_review", "scheduled"].includes(record.status)) {
    insertSeedActivityLog("meeting_request", meetingId, "Verification completed", record.verificationOutcome || "Citizen identity confirmed by DEO.", deo, dateShift(record.createdAt, 3, 12, 30));
  }
  if (record.revertDemo) {
    insertSeedActivityLog("meeting_request", meetingId, "Approval reverted", "Returned to initial review to capture updated availability.", admin, dateShift(record.createdAt, 4, 10, 30));
    insertSeedActivityLog("meeting_request", meetingId, "Meeting approved", "Re-approved after document correction.", admin, dateShift(record.createdAt, 5, 11, 0));
    insertSeedActivityLog("meeting_request", meetingId, "Verification requested", "Re-opened verification after approval revert.", admin, dateShift(record.createdAt, 5, 14, 0));
    insertSeedActivityLog("meeting_request", meetingId, "Verification completed", "DEO re-confirmed the citizen on call.", deo, dateShift(record.createdAt, 6, 12, 0));
  }
  if (record.status === "rejected") {
    insertSeedActivityLog("meeting_request", meetingId, "Meeting rejected", record.rejectReason || "Rejected during first-stage review.", admin, dateShift(record.createdAt, 1, 15, 30));
  }
  if (record.status === "scheduled") {
    insertSeedActivityLog("meeting_request", meetingId, "Meeting scheduled", `${record.scheduleDate} ${record.scheduleTime} at ${record.scheduleLocation}`, admin, dateShift(record.createdAt, 7, 15, 0));
    if (record.rescheduledDemo) {
      insertSeedActivityLog("meeting_request", meetingId, "Meeting rescheduled", `Moved to ${record.scheduleDate} ${record.scheduleTime}.`, admin, dateShift(record.createdAt, 8, 11, 15));
    }
    if (record.executionStatus === "completed") {
      insertSeedActivityLog("meeting_request", meetingId, "Meeting completed", "Citizen attended and meeting concluded successfully.", admin, dateShift(record.createdAt, 10, 16, 15));
    }
    if (record.executionStatus === "cancelled") {
      insertSeedActivityLog("meeting_request", meetingId, "Scheduled meeting cancelled", "Citizen requested cancellation after schedule confirmation.", admin, dateShift(record.createdAt, 9, 9, 45));
    }
  }
}

function insertDemoOperationalData(now, directory, seedPack = "default") {
  const base = new Date(now);
  const complaintTemplates = [
    { title: "Scholarship support delayed", details: "Citizen is waiting for a scholarship assistance decision from the district office.", type: "Education", location: "District facilitation centre" },
    { title: "Tourism permit approval pending", details: "Application for a tourism-linked permit has not moved after repeated visits.", type: "Tourism", location: "District tourism office" },
    { title: "Road repair request unresolved", details: "Road damage near the citizen's locality is affecting access and public safety.", type: "Infrastructure", location: "Ward office" },
    { title: "Heritage site maintenance issue", details: "Public facility upkeep at a heritage location needs urgent attention.", type: "Heritage", location: "Municipal heritage office" },
    { title: "Public grievance hearing request", details: "Citizen is requesting escalation due to no action from the local department.", type: "Public Grievance", location: "District grievance cell" },
    { title: "Small business license assistance", details: "License application has stalled without clear officer communication.", type: "Industry", location: "Single window cell" },
  ];
  const meetingPurposes = [
    "Personal hearing on unresolved departmental grievance",
    "Discussion on delayed tourism infrastructure support",
    "Minister-level review of civic issue escalation",
    "Follow-up on pending scholarship and welfare request",
    "Citizen delegation meeting for heritage access concern",
    "Representation on delayed business permit approval",
  ];
  const complaintStatuses = ["pooled", "assigned", "department_contact_identified", "call_scheduled", "followup_in_progress", "resolved", "completed"];
  const verificationPriorities = ["LOW", "MEDIUM", "HIGH", "VIP"];
  const complaintRecords = [];
  let complaintCounter = 1;
  let meetingCounter = 1;

  directory.citizens.forEach((citizen, citizenIndex) => {
    for (let complaintIndex = 0; complaintIndex < 3; complaintIndex += 1) {
      const template = complaintTemplates[(citizenIndex + complaintIndex) % complaintTemplates.length];
      const admin = directory.admins[(citizenIndex + complaintIndex) % directory.admins.length];
      const departmentIndex = (citizenIndex + complaintIndex) % 5;
      const departmentName = [
        "Culture Affairs Desk",
        "Tourism Outreach Cell",
        "Heritage Preservation Division",
        "Public Grievance Cell",
        "Industry Partnerships Wing",
      ][departmentIndex];
      const officer = [
        ["Neha Kapoor", "9811100001"],
        ["Ravi Nair", "9811100002"],
        ["Sonal Gupta", "9811100003"],
        ["Karan Malhotra", "9811100004"],
        ["Aditi Verma", "9811100005"],
      ][departmentIndex];
      const createdAt = dateShift(base, -1 * (citizenIndex + complaintIndex + 2), 9 + complaintIndex, 10);
      const status = (complaintIndex === 2 && citizenIndex % 2 === 0)
        ? "escalated_to_admin_meeting"
        : complaintStatuses[(citizenIndex + complaintIndex) % complaintStatuses.length];
      const record = {
        complaintId: `COMP-${String(complaintCounter).padStart(6, "0")}`,
        citizenId: citizen.id,
        citizenSnapshot: buildCitizenSnapshot(citizen),
        title: template.title,
        details: `${template.details} Case filed from ${citizen.city}, ${citizen.state}.`,
        complaintDate: createdAt.slice(0, 10),
        complaintLocation: template.location,
        complaintType: template.type,
        attachments: [],
        resolutionDocs: [],
        resolutionSummary: ["resolved", "completed"].includes(status) ? "Department has confirmed corrective action and citizen update was issued." : "",
        status,
        assignedAdminUserId: status === "pooled" ? null : admin.id,
        assignedAdminName: status === "pooled" ? "" : admin.name,
        referralAdminUserId: admin.id,
        department: status === "pooled" ? "" : departmentName,
        officerName: ["department_contact_identified", "call_scheduled", "followup_in_progress", "resolved", "completed", "escalated_to_admin_meeting"].includes(status) ? officer[0] : "",
        officerContact: ["department_contact_identified", "call_scheduled", "followup_in_progress", "resolved", "completed", "escalated_to_admin_meeting"].includes(status) ? officer[1] : "",
        manualContact: "",
        callScheduledAt: ["call_scheduled", "followup_in_progress", "resolved", "completed"].includes(status) ? dateShift(base, citizenIndex - complaintIndex, 16, 0) : "",
        callOutcome: ["followup_in_progress", "resolved", "completed"].includes(status) ? "Department confirmed action is underway and promised field update." : "",
        escalatedMeetingRequestId: null,
        statusReason: status === "pooled"
          ? "Awaiting admin assignment from the complaint pool."
          : status === "assigned"
            ? `Assigned to ${admin.name} for direct handling.`
            : status === "department_contact_identified"
              ? `Department point of contact captured for ${departmentName}.`
              : status === "call_scheduled"
                ? "Department follow-up call has been scheduled."
                : status === "followup_in_progress"
                  ? "Department follow-up is underway."
                  : status === "resolved"
                    ? "Complaint resolved and citizen notified."
                    : status === "completed"
                      ? "Complaint closed after resolution."
                      : "Complaint escalated to a minister meeting request.",
        reopenedCount: citizenIndex % 6 === 0 && complaintIndex === 1 ? 1 : 0,
        createdAt,
        updatedAt: dateShift(base, citizenIndex - complaintIndex, 18, 10),
      };
      const id = insertComplaintRecord(record);
      complaintRecords.push({ ...record, id, admin });
      seedComplaintLogs(record, id, admin);
      if (status === "pooled") {
        insertSeedNotification(admin.id, "Complaint Submitted", `New pooled complaint ${record.complaintId} from ${citizen.name}.`, `/cases/complaint/${id}`, createdAt);
      }
      if (["resolved", "completed"].includes(status)) {
        insertSeedNotification(citizen.id, "Complaint Update", `Complaint ${record.complaintId} has been ${status}.`, "/my-cases", dateShift(base, citizenIndex - complaintIndex, 19, 0), 1);
      }
      complaintCounter += 1;
    }
  });

  directory.citizens.forEach((citizen, citizenIndex) => {
    for (let meetingIndex = 0; meetingIndex < 2; meetingIndex += 1) {
      const admin = directory.admins[(citizenIndex + meetingIndex) % directory.admins.length];
      const workflowIndex = (citizenIndex * 2 + meetingIndex) % 10;
      const escalatedComplaint = meetingIndex === 1 && citizenIndex % 2 === 0
        ? complaintRecords.find((item) => item.citizenId === citizen.id && item.status === "escalated_to_admin_meeting")
        : null;
      const createdAt = dateShift(base, -1 * (citizenIndex + meetingIndex + 1), 10 + meetingIndex, 5);
      const meeting = {
        requestId: `MREQ-${String(meetingCounter).padStart(6, "0")}`,
        citizenId: citizen.id,
        citizenSnapshot: buildCitizenSnapshot(citizen),
        purpose: escalatedComplaint
          ? `Escalated hearing for ${escalatedComplaint.title.toLowerCase()}`
          : `${meetingPurposes[(citizenIndex + meetingIndex) % meetingPurposes.length]} for ${citizen.city}`,
        referralAdminUserId: admin.id,
        referralAdminName: admin.name,
        assignedAdminUserId: workflowIndex === 0 ? null : admin.id,
        assignedAdminName: workflowIndex === 0 ? "" : admin.name,
        attachments: [],
        status: "submitted",
        verificationOutcome: "",
        rejectReason: "",
        scheduleDate: "",
        scheduleTime: "",
        scheduleLocation: "",
        priority: "",
        priorityReason: "",
        visitorId: "",
        meetingDocket: "",
        adminNotes: "",
        statusReason: "Citizen submitted the meeting request.",
        executionStatus: "pending",
        escalatedFromComplaintId: escalatedComplaint?.id || null,
        createdAt,
        updatedAt: dateShift(base, citizenIndex - meetingIndex, 17, 0),
        rescheduledDemo: workflowIndex === 8,
        revertDemo: workflowIndex === 9,
      };

      if (workflowIndex === 1) {
        meeting.status = "approved";
        meeting.statusReason = "Approved by admin and awaiting DEO verification.";
        meeting.adminNotes = "Proceed to DEO verification before scheduling.";
      } else if (workflowIndex === 2) {
        meeting.status = "verification_needed";
        meeting.priority = verificationPriorities[citizenIndex % verificationPriorities.length];
        meeting.statusReason = "Verification in process with the DEO desk.";
        meeting.adminNotes = "Cross-check citizen identity and supporting reference on call.";
      } else if (workflowIndex === 3) {
        meeting.status = "under_review";
        meeting.priority = verificationPriorities[(citizenIndex + 1) % verificationPriorities.length];
        meeting.verificationOutcome = "Citizen identity confirmed by DEO call log; documents matched.";
        meeting.statusReason = "Verification completed and returned to admin for scheduling.";
        meeting.adminNotes = "Ready for schedule confirmation.";
      } else if (workflowIndex === 4 || workflowIndex === 5 || workflowIndex === 6 || workflowIndex === 8 || workflowIndex === 9) {
        meeting.status = "scheduled";
        meeting.priority = workflowIndex === 4 || workflowIndex === 6 ? "VIP" : workflowIndex === 5 ? "HIGH" : "";
        meeting.verificationOutcome = "Citizen identity confirmed by DEO verification call.";
        meeting.scheduleDate = dateOnly(base, citizenIndex + meetingIndex + 2);
        meeting.scheduleTime = timeOnly(11 + ((citizenIndex + meetingIndex) % 5), meetingIndex === 0 ? 0 : 30);
        meeting.scheduleLocation = workflowIndex === 4 || workflowIndex === 6 ? "Minister Secretariat Chamber" : "North Block Meeting Room 3";
        meeting.visitorId = `VIS-2026-${String(meetingCounter).padStart(4, "0")}`;
        meeting.meetingDocket = `DOC-2026-${String(meetingCounter).padStart(4, "0")}`;
        meeting.adminNotes = workflowIndex === 8 ? "Citizen requested a later slot; schedule updated." : "Bring ID proof and case reference.";
        meeting.statusReason = workflowIndex === 8 ? "Meeting rescheduled after citizen availability update." : "Meeting scheduled and pass available for citizen.";
        meeting.executionStatus = workflowIndex === 6 ? "completed" : workflowIndex === 5 ? "pending" : workflowIndex === 4 ? "pending" : workflowIndex === 8 ? "pending" : "pending";
        if (workflowIndex === 6) {
          meeting.scheduleDate = dateOnly(base, -2 - citizenIndex % 3);
          meeting.statusReason = "Meeting was held successfully.";
        }
      } else if (workflowIndex === 7) {
        meeting.status = "rejected";
        meeting.rejectReason = "Insufficient grounds for minister-level hearing at this stage.";
        meeting.statusReason = "Meeting rejected during admin review.";
      } else if (workflowIndex === 0) {
        meeting.status = "submitted";
      }

      if (workflowIndex === 9) {
        meeting.status = "scheduled";
        meeting.priority = "HIGH";
        meeting.verificationOutcome = "DEO re-confirmed the citizen after approval revert.";
        meeting.scheduleDate = dateOnly(base, citizenIndex + 5);
        meeting.scheduleTime = timeOnly(15, 15);
        meeting.scheduleLocation = "Secretariat Conference Hall";
        meeting.visitorId = `VIS-2026-${String(meetingCounter).padStart(4, "0")}`;
        meeting.meetingDocket = `DOC-2026-${String(meetingCounter).padStart(4, "0")}`;
        meeting.adminNotes = "Case was reverted once for correction and then rescheduled.";
        meeting.statusReason = "Meeting scheduled after revert, re-approval, and final verification.";
      }

      if (workflowIndex === 5) {
        meeting.executionStatus = "cancelled";
        meeting.statusReason = "Scheduled meeting cancelled after schedule confirmation.";
      }

      const id = insertMeetingRecord(meeting);
      seedMeetingLogs(meeting, id, admin, directory.deo);

      if (meeting.status === "submitted") {
        insertSeedNotification(admin.id, "Meeting Request", `New meeting request ${meeting.requestId} from ${citizen.name}.`, `/cases/meeting/${id}`, createdAt);
      }
      if (meeting.status === "approved") {
        insertSeedNotification(citizen.id, "Meeting Request", `Your request ${meeting.requestId} is under admin processing.`, "/meetings", dateShift(base, citizenIndex, 12, 20), 1);
      }
      if (meeting.status === "verification_needed") {
        insertSeedNotification(directory.deo.id, "Verification Request", `${meeting.requestId} requires ${meeting.priority.toLowerCase()} priority verification.`, `/verification-requests?priority=${meeting.priority}`, dateShift(base, citizenIndex, 13, 10));
      }
      if (meeting.status === "under_review") {
        insertSeedNotification(admin.id, "Verification Update", `${meeting.requestId} was verified by DEO and is ready for the next admin step.`, `/cases/meeting/${id}`, dateShift(base, citizenIndex, 14, 10), 1);
      }
      if (meeting.status === "scheduled") {
        insertSeedNotification(citizen.id, "Calendar Update", `Your meeting ${meeting.requestId} has been scheduled.`, "/meetings", dateShift(base, citizenIndex, 15, 0), 1);
        if (["VIP", "HIGH"].includes(meeting.priority) && meeting.executionStatus === "pending") {
          insertSeedNotification(directory.minister.id, "Calendar Update", `${meeting.requestId} was added to the minister calendar as a ${meeting.priority === "VIP" ? "VIP meeting" : "high-priority meeting"}.`, "/minister/calendar", dateShift(base, citizenIndex, 15, 30));
        }
      }
      if (meeting.status === "rejected") {
        insertSeedNotification(citizen.id, "Meeting Request", `Your meeting request ${meeting.requestId} was rejected.`, "/meetings", dateShift(base, citizenIndex, 12, 45), 1);
      }

      if (escalatedComplaint) {
        db.run(
          "UPDATE complaints SET escalatedMeetingRequestId=?, updatedAt=? WHERE id=?",
          [id, meeting.updatedAt, escalatedComplaint.id]
        );
      }

      meetingCounter += 1;
    }
  });

  const calendarEvents = [
    { title: "District Tourism Review", details: "Quarterly tourism infrastructure review with district teams.", eventType: "Field Review", scheduleAt: dateShift(base, -3, 11, 0), endAt: dateShift(base, -3, 13, 0), durationMinutes: 120, department: "Tourism Outreach Cell", attendanceStatus: "attended", attendedAt: dateShift(base, -3, 11, 5), classification: "Governance Work", participationRole: "Chair", portfolio: "Tourism", productivityScore: 8.9 },
    { title: "Heritage Museum Inspection", details: "Inspection of restoration progress and accessibility plan.", eventType: "Inspection", scheduleAt: dateShift(base, -1, 10, 30), endAt: dateShift(base, -1, 12, 0), durationMinutes: 90, department: "Heritage Preservation Division", attendanceStatus: "attended", attendedAt: dateShift(base, -1, 10, 40), classification: "Governance Work", participationRole: "Chair", portfolio: "Culture", productivityScore: 9.2 },
    { title: "Citizen Outreach Camp", details: "Public hearing camp for multi-department grievances.", eventType: "Public Outreach", scheduleAt: dateShift(base, 2, 15, 0), endAt: dateShift(base, 2, 17, 0), durationMinutes: 120, department: "Public Grievance Cell", attendanceStatus: "planned", attendedAt: "", classification: "Public Outreach", participationRole: "Chief Guest", portfolio: "Neither", productivityScore: 7.4 },
    { title: "Festival Coordination Meeting", details: "Review of safety, logistics, and public services for upcoming festival.", eventType: "Coordination", scheduleAt: dateShift(base, 4, 12, 0), endAt: dateShift(base, 4, 13, 30), durationMinutes: 90, department: "Culture Affairs Desk", attendanceStatus: "planned", attendedAt: "", classification: "Governance Work", participationRole: "Chair", portfolio: "Culture", productivityScore: 8.3 },
    { title: "Investor Facilitation Meet", details: "Meeting with small business and tourism investors.", eventType: "Investor Meet", scheduleAt: dateShift(base, 6, 16, 0), endAt: dateShift(base, 6, 18, 0), durationMinutes: 120, department: "Industry Partnerships Wing", attendanceStatus: "planned", attendedAt: "", classification: "Economic Affairs", participationRole: "Attendee", portfolio: "Tourism", productivityScore: 8.1 },
    { title: "Weekly Secretariat Briefing", details: "Internal coordination briefing with the minister office team.", eventType: "Internal Review", scheduleAt: dateShift(base, 1, 9, 30), endAt: dateShift(base, 1, 10, 30), durationMinutes: 60, department: "Minister Office", attendanceStatus: "planned", attendedAt: "", classification: "Governance Work", participationRole: "Chair", portfolio: "Neither", productivityScore: 7.8 },
  ];

  calendarEvents.forEach((event) => {
    insertCalendarEventRecord({
      ...event,
      mediaFolder: "",
      photos: [],
      documents: [],
      videoLink: "",
      createdByUserId: directory.deo.id,
      createdByName: directory.deo.name,
      createdAt: now,
      updatedAt: now,
    });
  });

  if (seedPack === "backlog") {
    directory.admins.forEach((admin, index) => {
      const citizen = directory.citizens[index];
      const complaintId = insertComplaintRecord({
        complaintId: `COMP-${String(complaintCounter + index).padStart(6, "0")}`,
        citizenId: citizen.id,
        citizenSnapshot: buildCitizenSnapshot(citizen),
        title: "Old grievance pending beyond SLA",
        details: `Extended backlog complaint from ${citizen.city} kept for demo SLA breach review.`,
        complaintDate: dateOnly(base, -20 - index),
        complaintLocation: "District office",
        complaintType: "Public Grievance",
        attachments: [],
        resolutionDocs: [],
        resolutionSummary: "",
        status: "followup_in_progress",
        assignedAdminUserId: admin.id,
        assignedAdminName: admin.name,
        referralAdminUserId: admin.id,
        department: "Public Grievance Cell",
        officerName: "Karan Malhotra",
        officerContact: "9811100004",
        manualContact: "",
        callScheduledAt: dateShift(base, -5 - index, 16, 0),
        callOutcome: "Department asked for more time; citizen requested escalation.",
        escalatedMeetingRequestId: null,
        statusReason: "Aged complaint retained in backlog for SLA tracking.",
        reopenedCount: 1,
        createdAt: dateShift(base, -20 - index, 11, 0),
        updatedAt: dateShift(base, -1, 17, 30),
      });
      insertSeedActivityLog("complaint", complaintId, "Complaint submitted", "Backlog scenario seed", { id: citizen.id, name: citizen.name }, dateShift(base, -20 - index, 11, 0));
      insertSeedActivityLog("complaint", complaintId, "Complaint assigned", `Assigned to ${admin.name}`, admin, dateShift(base, -19 - index, 11, 0));
    });
  }
}

function runSeeds(seedPack = "default") {
  const now = new Date().toISOString();
  const directory = insertUsers(now);
  insertDirectory(now);
  insertDemoOperationalData(now, directory, seedPack);
}

export function listDemoSeedPacks() {
  return [
    { id: "default", label: "Executive Demo", description: "20 citizens with 60 complaints, 40 meetings, DEO verification cases, scheduled VIP hearings, and full workflow coverage." },
    { id: "backlog", label: "Executive Demo + Backlog", description: "Adds extra aged grievance cases on top of the executive demo for SLA and pendency presentations." },
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
