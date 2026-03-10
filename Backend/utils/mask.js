export function maskAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== "string") return aadhaar;
  const cleaned = aadhaar.replace(/\s/g, "");
  if (cleaned.length < 4) return "****";
  return "****-****-" + cleaned.slice(-4);
}

export function maskCaseResponse(caseDoc) {
  if (!caseDoc) return caseDoc;
  const obj = typeof caseDoc.toObject === "function" ? caseDoc.toObject() : { ...caseDoc };
  if (obj.citizenSnapshot?.aadhaar) {
    obj.citizenSnapshot.aadhaar = maskAadhaar(obj.citizenSnapshot.aadhaar);
  }
  return obj;
}

export function maskUserResponse(userDoc) {
  if (!userDoc) return userDoc;
  const obj = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  if (obj.aadhaar) {
    obj.aadhaar = maskAadhaar(obj.aadhaar);
  }
  delete obj.password;
  return obj;
}
