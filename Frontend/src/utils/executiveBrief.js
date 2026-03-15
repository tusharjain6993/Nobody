import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadExecutiveBriefPdf({ filename, generatedFor, items = [] }) {
  const doc = new jsPDF();
  const today = new Date();

  doc.setFontSize(20);
  doc.text("Minister Executive Brief", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated: ${today.toLocaleString()}`, 14, 26);
  if (generatedFor) {
    doc.text(`Prepared for: ${generatedFor}`, 14, 32);
  }

  doc.setFontSize(11);
  doc.setTextColor(45, 45, 45);
  doc.text("Upcoming Agendas / Meetings", 14, 42);

  autoTable(doc, {
    startY: 48,
    head: [["Agenda", "Type", "Date", "Time", "Location", "Status"]],
    body: (items.length ? items : [{ label: "No upcoming agenda items", type: "-", date: "-", time: "-", location: "-", status: "-" }]).map((item) => [
      item.label || "-",
      item.type || "-",
      item.date || "-",
      item.time || "-",
      item.location || "-",
      item.status || "-",
    ]),
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.4 },
    headStyles: { fillColor: [91, 79, 233] },
  });

  doc.save(filename || "minister-executive-brief.pdf");
}
