// Static demo data tailored to the HCM portal domain.
// You can import these into dashboard charts, timelines, or list views
// when you need offline/demo data for presentations.

// --- Citizens (snapshot-style, similar to Case.citizenSnapshot) -----------

export const demoCitizens = [
  {
    id: "cit1",
    name: "Ramesh Kumar",
    email: "ramesh.kumar@example.com",
    phone: "9876543210",
    aadhaarMasked: "****-****-1234",
    gender: "MALE",
    age: 42,
    state: "Himachal Pradesh",
    districtCity: "Shimla",
  },
  {
    id: "cit2",
    name: "Sunita Devi",
    email: "sunita.devi@example.com",
    phone: "9876500012",
    aadhaarMasked: "****-****-5678",
    gender: "FEMALE",
    age: 35,
    state: "Himachal Pradesh",
    districtCity: "Mandi",
  },
  {
    id: "cit3",
    name: "Amit Sharma",
    email: "amit.sharma@example.com",
    phone: "9876500456",
    aadhaarMasked: "****-****-9012",
    gender: "MALE",
    age: 29,
    state: "Himachal Pradesh",
    districtCity: "Dharamshala",
  },
];

// --- Officials (role = official) ------------------------------------------

export const demoOfficials = [
  {
    id: "off1",
    name: "Rajesh Verma",
    role: "official",
    designation: "Executive Engineer (Roads)",
    department: "Municipal Corporation",
    state: "Himachal Pradesh",
    districtCity: "Shimla",
    email: "rajesh.verma@mc.hp.gov.in",
    phone: "01972-123456",
  },
  {
    id: "off2",
    name: "Priya Thakur",
    role: "official",
    designation: "Deputy Director (Social Welfare)",
    department: "Social Welfare",
    state: "Himachal Pradesh",
    districtCity: "Mandi",
    email: "priya.thakur@sw.hp.gov.in",
    phone: "01905-654321",
  },
  {
    id: "off3",
    name: "Anil Mehta",
    role: "official",
    designation: "Superintending Engineer (Water Supply)",
    department: "Water Supply Department",
    state: "Himachal Pradesh",
    districtCity: "Shimla",
    email: "anil.mehta@water.hp.gov.in",
    phone: "01972-222333",
  },
];

// --- Cases (shaped like backend Case model for demo dashboards) -----------

export const demoCases = [
  {
    _id: "case1",
    caseId: "HP-CASE-000101",
    citizenSnapshot: demoCitizens[0],
    purpose: "Request for urgent road repair in ward 5",
    category: "Road",
    referralPerson: "Local Councillor",
    state: "Himachal Pradesh",
    pincode: "171001",
    districtCity: "Shimla",
    localAreaMinister: "Sh. Anurag Sharma",
    urgency: "CRITICAL",
    details: "The main approach road to the village has caved in due to recent rains. School children and elderly cannot commute safely.",
    documents: [
      { name: "Road_photos.pdf", url: "#", uploadedAt: new Date().toISOString() },
    ],
    status: "SCHEDULED",
    reviewNote: "Site inspection scheduled with Executive Engineer.",
    schedule: {
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      slot: "11:00–11:30",
      type: "In-person",
      venue: "Office of Municipal Corporation, Shimla",
    },
    meetingSummary: "",
    actionRequired: "",
    responsibleAuthority: "",
    assignments: [
      {
        _id: "assg1",
        title: "Inspect road damage and submit report",
        assignedToName: demoOfficials[0].name,
        priority: "URGENT",
        status: "IN_PROGRESS",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        _id: "assg2",
        title: "Prepare estimate for temporary restoration",
        assignedToName: demoOfficials[0].name,
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    communications: [
      {
        type: "CALL",
        summary: "Spoke to citizen; confirmed extent of damage and shared tentative visit date.",
        happenedAt: new Date().toISOString(),
        createdByName: "Staff Officer",
        createdAt: new Date().toISOString(),
      },
      {
        type: "EMAIL",
        summary: "Emailed Executive Engineer with case details and photos.",
        happenedAt: new Date().toISOString(),
        createdByName: "Staff Officer",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "case2",
    caseId: "HP-CASE-000102",
    citizenSnapshot: demoCitizens[1],
    purpose: "Delay in disbursement of old-age pension",
    category: "Pension",
    referralPerson: "Panchayat Pradhan",
    state: "Himachal Pradesh",
    pincode: "175001",
    districtCity: "Mandi",
    localAreaMinister: "Smt. Neelam Devi",
    urgency: "HIGH",
    details: "Citizen has not received pension for last 4 months despite bank account being active.",
    documents: [
      { name: "Pension_passbook_scan.pdf", url: "#", uploadedAt: new Date().toISOString() },
    ],
    status: "APPROVED",
    reviewNote: "Verified eligibility; asked department to process pending installments.",
    schedule: {},
    assignments: [
      {
        _id: "assg3",
        title: "Verify pension status with Social Welfare office",
        assignedToName: demoOfficials[1].name,
        priority: "HIGH",
        status: "AWAITING_RESPONSE",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    communications: [
      {
        type: "MEETING_NOTE",
        summary: "Citizen met APS; documents collected and photocopied.",
        happenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdByName: "APS Office",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "case3",
    caseId: "HP-CASE-000103",
    citizenSnapshot: demoCitizens[2],
    purpose: "Request for transfer of electricity connection to new house",
    category: "Electricity",
    referralPerson: "Online Portal",
    state: "Himachal Pradesh",
    pincode: "176215",
    districtCity: "Dharamshala",
    localAreaMinister: "Sh. Sanjay Rana",
    urgency: "MEDIUM",
    details: "Citizen has constructed a new home and wants to shift existing connection from old address.",
    documents: [],
    status: "CLOSED",
    reviewNote: "Connection transferred as per consumer request.",
    schedule: {},
    meetingSummary: "Citizen satisfied with resolution; no further action required.",
    actionRequired: "Update consumer record in billing system.",
    responsibleAuthority: demoOfficials[2].name,
    assignments: [
      {
        _id: "assg4",
        title: "Update billing records",
        assignedToName: demoOfficials[2].name,
        priority: "MEDIUM",
        status: "RESOLVED",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    communications: [
      {
        type: "CALL",
        summary: "Telephonic confirmation given to citizen about completion.",
        happenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdByName: "Electricity Board Office",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// --- Dashboard-style aggregate stats --------------------------------------

export const demoDashboardStats = {
  totalCases: demoCases.length,
  submitted: 1,
  inReview: 0,
  approved: 1,
  rejected: 0,
  requestClarification: 0,
  resolvedWithoutMeeting: 0,
  scheduled: demoCases.filter((c) => c.status === "SCHEDULED").length,
  closed: demoCases.filter((c) => c.status === "CLOSED").length,
  resolved: 0,
  urgentHigh: demoCases.filter((c) => c.urgency === "HIGH" || c.urgency === "CRITICAL").length,
  openAssignments: demoCases.reduce(
    (sum, c) =>
      sum +
      (c.assignments || []).filter(
        (a) => !["RESOLVED", "CLOSED"].includes(a.status)
      ).length,
    0
  ),
};

// --- Helper: build a simple meetings list from demoCases ------------------

export const demoUpcomingMeetings = demoCases
  .filter((c) => c.status === "SCHEDULED" && c.schedule?.scheduledAt)
  .sort((a, b) => new Date(a.schedule.scheduledAt) - new Date(b.schedule.scheduledAt));

