import jsPDF from "jspdf";
import QRCode from "qrcode";

const PASS_VERSION = 1;
const PASS_CHECKSUM_SALT = "nobody-meeting-pass-demo-v1";

function base64UrlEncode(value) {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

async function sha256Hex(value) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildPassPayload(meeting) {
  return {
    v: PASS_VERSION,
    requestId: meeting.requestId,
    citizenId: meeting.citizenSnapshot?.citizenId || "",
    citizenName: meeting.citizenSnapshot?.name || "Citizen",
    purpose: meeting.purpose || "",
    scheduleDate: meeting.scheduleDate || "",
    scheduleTime: meeting.scheduleTime || "",
    scheduleLocation: meeting.scheduleLocation || "",
    visitorId: meeting.visitorId || "",
    meetingDocket: meeting.meetingDocket || "",
    adminNotes: meeting.adminNotes || "",
    issuedAt: new Date().toISOString(),
  };
}

export async function createMeetingPassToken(meeting) {
  const payload = buildPassPayload(meeting);
  const payloadString = JSON.stringify(payload);
  const checksum = await sha256Hex(`${payloadString}::${PASS_CHECKSUM_SALT}`);
  return `${base64UrlEncode(payloadString)}.${checksum.slice(0, 20)}`;
}

export async function decodeMeetingPassToken(token) {
  try {
    const [encodedPayload, checksum] = String(token || "").split(".");
    if (!encodedPayload || !checksum) {
      return { valid: false, error: "Invalid meeting pass token." };
    }
    const payloadString = base64UrlDecode(encodedPayload);
    const expected = await sha256Hex(`${payloadString}::${PASS_CHECKSUM_SALT}`);
    if (expected.slice(0, 20) !== checksum) {
      return { valid: false, error: "Meeting pass checksum mismatch." };
    }
    const payload = JSON.parse(payloadString);
    if (payload.v !== PASS_VERSION) {
      return { valid: false, error: "Unsupported meeting pass version." };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Unable to decode meeting pass." };
  }
}

export async function buildMeetingPassUrl(token) {
  const fallbackPath = `/meeting-pass/${encodeURIComponent(token)}`;
  if (typeof window === "undefined") return fallbackPath;
  return new URL(fallbackPath, window.location.origin).toString();
}

export async function downloadMeetingPassPdf(meeting) {
  const token = await createMeetingPassToken(meeting);
  const verificationUrl = await buildMeetingPassUrl(token);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 220,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const line = (label, value, y) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(label, 54, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(String(value || "Pending"), 180, y);
  };

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(40, 34, 515, 88, 18, 18, "F");
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("Meeting Access Pass", 54, 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Demo-generated citizen meeting pass with QR verification.", 54, 100);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(40, 138, 515, 602, 18, 18, "FD");
  doc.addImage(qrDataUrl, "PNG", 360, 180, 150, 150);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(meeting.purpose || "Scheduled Meeting", 54, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("Present this pass at the meeting venue. Scanning the QR opens the verification screen.", 54, 206, { maxWidth: 270 });

  line("Citizen Name", meeting.citizenSnapshot?.name, 266);
  line("Citizen ID", meeting.citizenSnapshot?.citizenId, 296);
  line("Request ID", meeting.requestId, 326);
  line("Visitor ID", meeting.visitorId, 356);
  line("Meeting Docket", meeting.meetingDocket, 386);
  line("Scheduled Date", meeting.scheduleDate, 416);
  line("Scheduled Time", meeting.scheduleTime, 446);
  line("Location", meeting.scheduleLocation, 476);
  line("Admin Desk", meeting.assignedAdminName || meeting.referralAdminName, 506);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Admin Notes", 54, 548);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(meeting.adminNotes || "No additional notes.", 54, 570, { maxWidth: 260 });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Verification URL", 54, 654);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(37, 99, 235);
  doc.text(verificationUrl, 54, 676, { maxWidth: 455 });

  doc.setDrawColor(226, 232, 240);
  doc.line(54, 700, 510, 700);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("This pass is demo-only. It is suitable for frontend-only verification flows, not real secure identity validation.", 54, 722, { maxWidth: 456 });

  doc.save(`meeting-pass-${meeting.requestId || "scheduled-meeting"}.pdf`);
  return { token, verificationUrl };
}
