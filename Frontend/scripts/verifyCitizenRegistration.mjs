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

const { authApi } = await import("../src/minister/ministerApi.js");

const payload = {
  name: "Test Citizen",
  email: "testcitizen@example.com",
  aadhaar: "999988887777",
  age: "29",
  gender: "Male",
  phonePrimary: "9876543219",
  pinCode: "302001",
  state: "Rajasthan",
  city: "Jaipur",
  mpName: "Manju Sharma",
  photo: {
    name: "photo.jpg",
    type: "image/jpeg",
    data: "data:image/jpeg;base64,ZmFrZQ==",
  },
};

const reg = await authApi.register(payload);
const rec = await authApi.recoverCitizenId({ aadhaar: payload.aadhaar, phone: payload.phonePrimary });

console.log(JSON.stringify({ reg, rec }, null, 2));
