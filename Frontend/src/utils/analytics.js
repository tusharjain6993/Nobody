const CLASSIFICATION_WEIGHTS = {
  "Governance Work": 1.35,
  "Political Engagement": 1.2,
  "Cultural / Public Outreach": 1.05,
  "Media Engagement": 0.95,
  "Delegation / Diplomacy": 1.15,
  "Official Visit": 1.1,
  "Industry Meeting": 1.18,
};

const ROLE_MULTIPLIERS = {
  Chair: 1.25,
  Speaker: 1.15,
  Attendee: 1,
};

const PORTFOLIO_MULTIPLIERS = {
  Both: 1.2,
  Culture: 1.1,
  Tourism: 1.1,
  Neither: 0.9,
};

export function classifyEvent({ title = "", details = "", department = "", eventType = "" }) {
  const haystack = `${title} ${details} ${department} ${eventType}`.toLowerCase();
  if (/media|press|interview|briefing/.test(haystack)) return "Media Engagement";
  if (/industry|investor|business|trade/.test(haystack)) return "Industry Meeting";
  if (/diplomacy|delegation|foreign|embassy/.test(haystack)) return "Delegation / Diplomacy";
  if (/political|party|constituency|campaign/.test(haystack)) return "Political Engagement";
  if (/visit|inspection|field/.test(haystack)) return "Official Visit";
  if (/culture|museum|festival|heritage|public outreach/.test(haystack)) return "Cultural / Public Outreach";
  return "Governance Work";
}

export function calculateProductivityScore(event) {
  const durationMinutes = Number(event.durationMinutes || 0);
  const classification = event.classification || classifyEvent(event);
  const baseWeight = CLASSIFICATION_WEIGHTS[classification] || 1;
  const durationMultiplier = Math.max(0.75, Math.min(2.5, durationMinutes / 60 || 1));
  const roleMultiplier = ROLE_MULTIPLIERS[event.participationRole] || 1;
  const portfolioMultiplier = PORTFOLIO_MULTIPLIERS[event.portfolio] || 1;

  // Deterministic demo formula:
  // score = base classification weight * duration multiplier * participation multiplier * portfolio relevance
  return Number((baseWeight * durationMultiplier * roleMultiplier * portfolioMultiplier * 4).toFixed(2));
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function buildAnalytics(events = [], complaints = [], meetingRequests = []) {
  const attended = events.filter((event) => event.attendanceStatus === "attended");
  const dailyMap = {};
  const weeklyMap = {};
  const monthlyMap = {};
  const categoryMinutes = {};
  const departmentFrequency = {};
  let totalHours = 0;

  attended.forEach((event) => {
    const date = new Date(event.attendedAt || event.scheduleAt);
    const dayKey = date.toISOString().slice(0, 10);
    const weekKey = startOfWeek(date).toISOString().slice(0, 10);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const score = Number(event.productivityScore || 0);
    const durationHours = Number(event.durationMinutes || 0) / 60;

    dailyMap[dayKey] = (dailyMap[dayKey] || 0) + score;
    weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + score;
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + score;
    categoryMinutes[event.classification] = (categoryMinutes[event.classification] || 0) + Number(event.durationMinutes || 0);
    if (event.department) {
      departmentFrequency[event.department] = (departmentFrequency[event.department] || 0) + 1;
    }
    totalHours += durationHours;
  });

  complaints.forEach((complaint) => {
    if (complaint.department) {
      departmentFrequency[complaint.department] = (departmentFrequency[complaint.department] || 0) + 1;
    }
  });

  meetingRequests.forEach((meeting) => {
    if (meeting.scheduleLocation) {
      departmentFrequency[meeting.scheduleLocation] = (departmentFrequency[meeting.scheduleLocation] || 0) + 1;
    }
  });

  const dailyScores = Object.entries(dailyMap).map(([date, score]) => ({ date, score }));
  const weeklyScores = Object.entries(weeklyMap).map(([week, score]) => ({ week, score }));
  const monthlyScores = Object.entries(monthlyMap).map(([month, score]) => ({ month, score }));
  const timeAllocation = Object.entries(categoryMinutes).map(([name, minutes]) => ({ name, value: Number((minutes / 60).toFixed(1)) }));
  const departmentInteractions = Object.entries(departmentFrequency)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const totalAttended = attended.length || 1;
  const governanceScore = attended
    .filter((event) => event.classification === "Governance Work")
    .reduce((sum, event) => sum + Number(event.productivityScore || 0), 0);
  const ceremonialScore = attended
    .filter((event) => ["Cultural / Public Outreach", "Official Visit", "Media Engagement"].includes(event.classification))
    .reduce((sum, event) => sum + Number(event.productivityScore || 0), 0);
  const politicalEvents = attended.filter((event) => event.classification === "Political Engagement").length;
  const policyEvents = attended.filter((event) => event.classification === "Governance Work").length;
  const outreachEvents = attended.filter((event) => event.classification === "Cultural / Public Outreach").length;
  const cultureEvents = attended.filter((event) => event.portfolio === "Culture" || event.portfolio === "Both").length;
  const tourismEvents = attended.filter((event) => event.portfolio === "Tourism" || event.portfolio === "Both").length;

  const peakDays = [...dailyScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const averagePerDay = dailyScores.length ? attended.length / dailyScores.length : 0;

  return {
    dailyScores,
    weeklyScores,
    monthlyScores,
    workingHours: Number(totalHours.toFixed(1)),
    meetingDensity: Number(averagePerDay.toFixed(2)),
    decisionIntensity: complaints.filter((item) => ["resolved", "escalated_to_admin_meeting"].includes(item.status)).length,
    policyEngagementIndex: Number(((policyEvents / totalAttended) * 100).toFixed(1)),
    publicOutreachIndex: Number(((outreachEvents / totalAttended) * 100).toFixed(1)),
    politicalEngagementIndex: Number(((politicalEvents / totalAttended) * 100).toFixed(1)),
    portfolioUtilisation: {
      culture: Number(((cultureEvents / totalAttended) * 100).toFixed(1)),
      tourism: Number(((tourismEvents / totalAttended) * 100).toFixed(1)),
    },
    peakDays,
    timeAllocation,
    departmentInteractions,
    governanceVsCeremonialRatio: ceremonialScore ? Number((governanceScore / ceremonialScore).toFixed(2)) : Number(governanceScore.toFixed(2)),
  };
}
