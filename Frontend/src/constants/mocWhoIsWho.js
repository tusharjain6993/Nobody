// Ministry of Culture – Who's Who (subset used in the portal)
// Derived from: https://culture.gov.in/ministry/our-team

// Office of Minister for Culture – key staff
export const MOC_MINISTER_OFFICE_STAFF = [
  {
    id: "OMC_PS_VISHAL_GUPTA",
    name: "Shri Vishal Gupta",
    designation: "Private Secretary",
    phone: ["+91 24014301", "+91 11 24014302"],
    email: "hcm-culture@gov.in",
    department: "Minister's Office",
    officeAddress: "Room No. 22106, Kartavya Bhawan 2, New Delhi – 110001",
  },
  {
    id: "OMC_APS_MAHENDRA_PRATAP_SINGH",
    name: "Shri Mahendra Pratap Singh",
    designation: "Additional Private Secretary",
    phone: ["+91 11 24014301", "+91 11 24014302"],
    email: null,
    department: "Minister's Office",
    officeAddress: "Room No. 22106, Kartavya Bhawan 2, New Delhi – 110001",
  },
  {
    id: "OMC_ASPS_CHIRAG_PANCHAL",
    name: "Shri Chirag Panchal",
    designation: "Assistant Private Secretary",
    phone: ["+91 11 24014301", "+91 11 24014302"],
    email: null,
    department: "Minister's Office",
    officeAddress: "Room No. 22106, Kartavya Bhawan 2, New Delhi – 110001",
  },
];

// High-level departments/offices for Category dropdown
export const MOC_DEPARTMENTS = [
  { id: "MINISTER_OFFICE", name: "Minister's Office" },
  { id: "MINISTER_STATE_OFFICE", name: "Minister of State's Office" },
  { id: "SECRETARIAT", name: "Secretariat (Culture)" },
  { id: "FINANCE_ADMIN", name: "Finance & Administration (AS&FA)" },
  { id: "ADDITIONAL_SECRETARY", name: "Additional Secretary's Office" },
  { id: "JOINT_SECRETARY", name: "Joint Secretaries" },
  { id: "DIRECTORATES", name: "Directorates" },
  { id: "DEPUTY_SECRETARY", name: "Deputy Secretaries" },
  { id: "UNDER_SECRETARY", name: "Under Secretaries" },
  { id: "SECTION_OFFICER", name: "Section Officers" },
  { id: "OTHER", name: "Other" },
];

// Organizational directory: officers grouped by department for assignment routing
export const MOC_ORG_DIRECTORY = [
  {
    department: "Minister's Office",
    officers: [
      { name: "Shri Vishal Gupta", designation: "Private Secretary" },
      { name: "Shri Mahendra Pratap Singh", designation: "Additional Private Secretary" },
      { name: "Shri Chirag Panchal", designation: "Assistant Private Secretary" },
      { name: "Shri Mregendra", designation: "Personal Assistant" },
    ],
  },
  {
    department: "Minister of State's Office",
    officers: [
      { name: "Shri Govind Mohan", designation: "Secretary (Culture)" },
    ],
  },
  {
    department: "Secretariat (Culture)",
    officers: [
      { name: "Ms. Nidhi Khare", designation: "Additional Secretary & Financial Adviser" },
    ],
  },
  {
    department: "Joint Secretaries",
    officers: [
      { name: "Shri Rajesh Aggarwal", designation: "Joint Secretary (Admin)" },
      { name: "Shri Mrutyunjay Sahoo", designation: "Joint Secretary (Museums)" },
      { name: "Smt. Nirupama Kotru", designation: "Joint Secretary (Academics)" },
    ],
  },
  {
    department: "Deputy Secretaries",
    officers: [
      { name: "Shri Sunil Kumar", designation: "Deputy Secretary (Budget)" },
      { name: "Smt. Poonam Gupta", designation: "Deputy Secretary (Coordination)" },
    ],
  },
  {
    department: "Under Secretaries",
    officers: [
      { name: "Shri Ravi Shankar", designation: "Under Secretary (Admin I)" },
      { name: "Smt. Meena Kumari", designation: "Under Secretary (Admin II)" },
    ],
  },
  {
    department: "Directorates",
    officers: [
      { name: "Shri K.K. Chakravorty", designation: "DG – National Museum" },
      { name: "Shri B.R. Mani", designation: "DG – ASI" },
      { name: "Shri Sachchidanand Joshi", designation: "Member Secretary – IGNCA" },
    ],
  },
  {
    department: "Finance & Administration (AS&FA)",
    officers: [
      { name: "Ms. Nidhi Khare", designation: "AS & Financial Adviser" },
    ],
  },
];

export const ASSIGNMENT_TYPES = [
  { value: "IN_PERSON", label: "In Person" },
  { value: "VIDEO_CONFERENCE", label: "Video Conference" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "DOCUMENT_REVIEW", label: "Document Review" },
  { value: "FIELD_VISIT", label: "Field Visit" },
  { value: "WRITTEN_RESPONSE", label: "Written Response" },
  { value: "INTER_DEPARTMENT", label: "Inter-Department Referral" },
  { value: "OTHER", label: "Other" },
];

export const TIME_SLOTS = [
  "09:00–10:00",
  "10:00–11:00",
  "11:00–12:00",
  "12:00–13:00",
  "14:00–15:00",
  "15:00–16:00",
  "16:00–17:00",
  "17:00–18:00",
];
