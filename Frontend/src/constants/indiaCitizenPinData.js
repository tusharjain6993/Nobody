// Major PIN mappings for the demo registration flow.
// Sources checked on 2026-03-14:
// - India Post / public PIN references for Delhi and Rajasthan PIN-city-state mapping
// - 2024 Lok Sabha result references for current MPs tied to the mapped city/constituency
export const INDIA_CITIZEN_PIN_DATA = {
  "110001": { state: "Delhi", city: "New Delhi", mp: "Bansuri Swaraj" },
  "110011": { state: "Delhi", city: "New Delhi", mp: "Bansuri Swaraj" },
  "110018": { state: "Delhi", city: "West Delhi", mp: "Kamaljeet Sehrawat" },
  "110024": { state: "Delhi", city: "South Delhi", mp: "Ramvir Singh Bidhuri" },
  "110092": { state: "Delhi", city: "East Delhi", mp: "Harsh Malhotra" },
  "302001": { state: "Rajasthan", city: "Jaipur", mp: "Manju Sharma" },
  "302017": { state: "Rajasthan", city: "Jaipur", mp: "Manju Sharma" },
  "305001": { state: "Rajasthan", city: "Ajmer", mp: "Bhagirath Choudhary" },
  "313001": { state: "Rajasthan", city: "Udaipur", mp: "Mannalal Rawat" },
  "324001": { state: "Rajasthan", city: "Kota", mp: "Om Birla" },
  "334001": { state: "Rajasthan", city: "Bikaner", mp: "Arjun Ram Meghwal" },
  "342001": { state: "Rajasthan", city: "Jodhpur", mp: "Gajendra Singh Shekhawat" },
};

export function lookupCitizenPin(pinCode) {
  return INDIA_CITIZEN_PIN_DATA[String(pinCode || "").trim()] || null;
}
