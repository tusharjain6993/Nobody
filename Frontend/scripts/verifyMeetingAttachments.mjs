class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }
}

globalThis.localStorage = new MemoryStorage();
globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");
globalThis.btoa = (value) => Buffer.from(value, "binary").toString("base64");

const { authApi, citizenApi } = await import("../src/minister/ministerApi.js");

await authApi.register({
  name: "Meeting Test User",
  email: "meetingtest@example.com",
  aadhaar: "999911112222",
  age: "30",
  gender: "Male",
  phonePrimary: "9876543218",
  pinCode: "110001",
  state: "Delhi",
  city: "New Delhi",
  mpName: "Bansuri Swaraj",
  photo: { name: "photo.jpg", type: "image/jpeg", data: "data:image/jpeg;base64,ZmFrZQ==" },
});

const citizenLogin = await authApi.loginByCitizenId("CTZ-HP-000008");
localStorage.setItem("hcm_user", JSON.stringify(citizenLogin.user));
localStorage.setItem("hcm_token", citizenLogin.token);

const res = await citizenApi.createMeetingRequest({
  purpose: "Test attachment request",
  attachments: [
    { name: "doc1.pdf", type: "application/pdf", data: "data:application/pdf;base64,ZmFrZQ==" },
    { name: "doc2.pdf", type: "application/pdf", data: "data:application/pdf;base64,ZmFrZTI=" },
  ],
});

console.log(JSON.stringify(res.meetingRequest.attachments, null, 2));
