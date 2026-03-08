// ============================================================
// STATIC DATA FOR MINISTER DASHBOARD
// ============================================================

export const staticEmployees = [
  { _id: "emp1", name: "Arjun Sharma",   role: "manager",      isActive: true,  profile_img: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=6366f1&color=fff" },
  { _id: "emp2", name: "Priya Mehta",    role: "team leader",  isActive: true,  profile_img: "https://ui-avatars.com/api/?name=Priya+Mehta&background=10b981&color=fff" },
  { _id: "emp3", name: "Rahul Verma",    role: "developer",    isActive: true,  profile_img: "https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff" },
  { _id: "emp4", name: "Sneha Patel",    role: "designer",     isActive: true,  profile_img: "https://ui-avatars.com/api/?name=Sneha+Patel&background=ec4899&color=fff" },
  { _id: "emp5", name: "Vikram Singh",   role: "developer",    isActive: true,  profile_img: "https://ui-avatars.com/api/?name=Vikram+Singh&background=8b5cf6&color=fff" },
  { _id: "emp6", name: "Ananya Gupta",   role: "analyst",      isActive: false, profile_img: "https://ui-avatars.com/api/?name=Ananya+Gupta&background=94a3b8&color=fff" },
  { _id: "emp7", name: "Karan Joshi",    role: "developer",    isActive: true,  profile_img: "https://ui-avatars.com/api/?name=Karan+Joshi&background=f43f5e&color=fff" },
  { _id: "emp8", name: "Divya Nair",     role: "tester",       isActive: false, profile_img: "https://ui-avatars.com/api/?name=Divya+Nair&background=06b6d4&color=fff" },
];

export const staticProjects = [
  { _id: "proj1", name: "HCM Portal Redesign",        status: "In Progress" },
  { _id: "proj2", name: "Employee Onboarding System", status: "Completed" },
  { _id: "proj3", name: "Payroll Automation",         status: "Pending" },
  { _id: "proj4", name: "Attendance Tracker",         status: "Completed" },
  { _id: "proj5", name: "Leave Management Module",    status: "In Progress" },
  { _id: "proj6", name: "Performance Review Tool",    status: "Not Started" },
  { _id: "proj7", name: "Recruitment Dashboard",      status: "Postpone" },
  { _id: "proj8", name: "Training Portal",            status: "Completed" },
];

const today = new Date();
const d = (offsetDays, hour = 10, min = 0) => {
  const dt = new Date(today);
  dt.setDate(today.getDate() + offsetDays);
  dt.setHours(hour, min, 0, 0);
  return dt.toISOString();
};

export const staticTasks = [
  {
    _id: "task1",
    title: "Design Login Page",
    status: "Completed",
    priority: "high",
    projectId: { _id: "proj1", name: "HCM Portal Redesign" },
    assignees: [
      { _id: "emp4", name: "Sneha Patel",  avatar: "https://ui-avatars.com/api/?name=Sneha+Patel&background=ec4899&color=fff" },
      { _id: "emp2", name: "Priya Mehta",  avatar: "https://ui-avatars.com/api/?name=Priya+Mehta&background=10b981&color=fff" },
    ],
    start: d(0, 10, 0),
    end:   d(0, 13, 0),
    createdAt: d(-10),
    updatedAt: d(-1),
  },
  {
    _id: "task2",
    title: "Backend API Integration",
    status: "In Progress",
    priority: "high",
    projectId: { _id: "proj1", name: "HCM Portal Redesign" },
    assignees: [
      { _id: "emp3", name: "Rahul Verma",  avatar: "https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff" },
      { _id: "emp5", name: "Vikram Singh", avatar: "https://ui-avatars.com/api/?name=Vikram+Singh&background=8b5cf6&color=fff" },
    ],
    start: d(0, 11, 30),
    end:   d(0, 14, 30),
    createdAt: d(-8),
    updatedAt: d(0),
  },
  {
    _id: "task3",
    title: "Database Schema Design",
    status: "Completed",
    priority: "medium",
    projectId: { _id: "proj3", name: "Payroll Automation" },
    assignees: [
      { _id: "emp1", name: "Arjun Sharma", avatar: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=6366f1&color=fff" },
    ],
    start: d(0, 10, 0),
    end:   d(0, 11, 0),
    createdAt: d(-15),
    updatedAt: d(-3),
  },
  {
    _id: "task4",
    title: "Unit Testing - Auth Module",
    status: "Pending",
    priority: "low",
    projectId: { _id: "proj2", name: "Employee Onboarding System" },
    assignees: [
      { _id: "emp8", name: "Divya Nair",   avatar: "https://ui-avatars.com/api/?name=Divya+Nair&background=06b6d4&color=fff" },
      { _id: "emp7", name: "Karan Joshi",  avatar: "https://ui-avatars.com/api/?name=Karan+Joshi&background=f43f5e&color=fff" },
    ],
    start: d(0, 13, 0),
    end:   d(0, 16, 0),
    createdAt: d(-5),
    updatedAt: d(-1),
  },
  {
    _id: "task5",
    title: "UI Wireframes for Dashboard",
    status: "In Progress",
    priority: "high",
    projectId: { _id: "proj1", name: "HCM Portal Redesign" },
    assignees: [
      { _id: "emp4", name: "Sneha Patel",  avatar: "https://ui-avatars.com/api/?name=Sneha+Patel&background=ec4899&color=fff" },
    ],
    start: d(0, 15, 0),
    end:   d(0, 17, 0),
    createdAt: d(-2),
    updatedAt: d(0),
  },
  {
    _id: "task6",
    title: "Payroll Calculation Logic",
    status: "Postpone",
    priority: "high",
    projectId: { _id: "proj3", name: "Payroll Automation" },
    assignees: [
      { _id: "emp3", name: "Rahul Verma",  avatar: "https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff" },
    ],
    start: d(1, 10, 0),
    end:   d(1, 12, 0),
    createdAt: d(-6),
    updatedAt: d(-2),
  },
  {
    _id: "task7",
    title: "Employee Profile Module",
    status: "Completed",
    priority: "medium",
    projectId: { _id: "proj2", name: "Employee Onboarding System" },
    assignees: [
      { _id: "emp2", name: "Priya Mehta",  avatar: "https://ui-avatars.com/api/?name=Priya+Mehta&background=10b981&color=fff" },
      { _id: "emp6", name: "Ananya Gupta", avatar: "https://ui-avatars.com/api/?name=Ananya+Gupta&background=94a3b8&color=fff" },
    ],
    start: d(-1, 9, 0),
    end:   d(-1, 11, 0),
    createdAt: d(-12),
    updatedAt: d(-1),
  },
  {
    _id: "task8",
    title: "Leave Request Workflow",
    status: "Not Started",
    priority: "low",
    projectId: { _id: "proj5", name: "Leave Management Module" },
    assignees: [
      { _id: "emp1", name: "Arjun Sharma", avatar: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=6366f1&color=fff" },
      { _id: "emp7", name: "Karan Joshi",  avatar: "https://ui-avatars.com/api/?name=Karan+Joshi&background=f43f5e&color=fff" },
    ],
    start: d(2, 10, 0),
    end:   d(2, 12, 0),
    createdAt: d(-3),
    updatedAt: d(-1),
  },
  {
    _id: "task9",
    title: "Recruitment Pipeline Screen",
    status: "Pending",
    priority: "medium",
    projectId: { _id: "proj7", name: "Recruitment Dashboard" },
    assignees: [
      { _id: "emp5", name: "Vikram Singh", avatar: "https://ui-avatars.com/api/?name=Vikram+Singh&background=8b5cf6&color=fff" },
    ],
    start: d(1, 14, 0),
    end:   d(1, 16, 30),
    createdAt: d(-4),
    updatedAt: d(-1),
  },
  {
    _id: "task10",
    title: "Analytics Reports Integration",
    status: "In Progress",
    priority: "medium",
    projectId: { _id: "proj6", name: "Performance Review Tool" },
    assignees: [
      { _id: "emp6", name: "Ananya Gupta", avatar: "https://ui-avatars.com/api/?name=Ananya+Gupta&background=94a3b8&color=fff" },
      { _id: "emp3", name: "Rahul Verma",  avatar: "https://ui-avatars.com/api/?name=Rahul+Verma&background=f59e0b&color=fff" },
    ],
    start: d(0, 14, 0),
    end:   d(0, 17, 0),
    createdAt: d(-7),
    updatedAt: d(0),
  },
  {
    _id: "task11",
    title: "Training Module Video Upload",
    status: "Completed",
    priority: "low",
    projectId: { _id: "proj8", name: "Training Portal" },
    assignees: [
      { _id: "emp8", name: "Divya Nair",   avatar: "https://ui-avatars.com/api/?name=Divya+Nair&background=06b6d4&color=fff" },
    ],
    start: d(-2, 10, 0),
    end:   d(-2, 12, 0),
    createdAt: d(-20),
    updatedAt: d(-2),
  },
  {
    _id: "task12",
    title: "Attendance Biometric Sync",
    status: "Completed",
    priority: "high",
    projectId: { _id: "proj4", name: "Attendance Tracker" },
    assignees: [
      { _id: "emp1", name: "Arjun Sharma", avatar: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=6366f1&color=fff" },
      { _id: "emp5", name: "Vikram Singh", avatar: "https://ui-avatars.com/api/?name=Vikram+Singh&background=8b5cf6&color=fff" },
    ],
    start: d(-3, 9, 0),
    end:   d(-3, 12, 0),
    createdAt: d(-25),
    updatedAt: d(-3),
  },
];
