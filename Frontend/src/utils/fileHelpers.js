const COMPLAINT_ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_COMPLAINT_SIZE = 50 * 1024 * 1024;

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export async function filesToDocuments(files = []) {
  const docs = [];
  for (const file of files) {
    docs.push({
      name: file.name,
      type: file.type,
      size: file.size,
      data: await readFile(file),
    });
  }
  return docs;
}

export function validateComplaintFiles(files = []) {
  for (const file of files) {
    if (!COMPLAINT_ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Complaint documents must be PDF, image, or Excel files.");
    }
    if (file.size > MAX_COMPLAINT_SIZE) {
      throw new Error("Each complaint file must be 50 MB or smaller.");
    }
  }
}
