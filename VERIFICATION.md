# Portal Functioning Verification Checklist

Use this checklist to verify the HCM Portal after code cleanup. Run the Backend (`npm run dev` in `Backend`) and Frontend (`npm run dev` in `Frontend`) before testing.

## Auth

| Step | Description | Pass/Fail |
|------|-------------|-----------|
| 1 | Register new citizen → receive OTP (check response or email) → verify OTP → see success → go to Login | |
| 2 | Login as citizen (`citizen@test.com` / `test123`) → redirect to `/new-case`; sidebar shows Add Case, Track Cases, Settings | |
| 3 | Login as admin (`admin@portal.gov` / `admin123`) → redirect to `/dashboard`; sidebar shows Dashboard, Employees, Department, Cases, Settings | |
| 4 | Logout → redirect to login; open a protected URL while logged out → redirect to `/login` | |

## Citizen flows

| Step | Description | Pass/Fail |
|------|-------------|-----------|
| 5 | Submit a new case from `/new-case`; see success (and optionally redirect to `/my-cases`) | |
| 6 | Open `/my-cases`; list shows the user's cases; open a case detail if available | |
| 7 | Settings page loads without error | |

## Admin flows

| Step | Description | Pass/Fail |
|------|-------------|-----------|
| 8 | Dashboard loads; stats and department overview from API; sample data note visible for timeline/widgets | |
| 9 | Employees: list loads; add employee and status toggle work if implemented | |
| 10 | Department: list/overview loads; add department works if implemented | |
| 11 | Cases: list with filters (search, status) loads; open case by id; dashboard stats reflect case counts | |

## API

| Step | Description | Pass/Fail |
|------|-------------|-----------|
| 12 | Backend health: `GET http://localhost:4000/` returns JSON `{ "status": "HCM Backend running" }` | |
| 13 | Invalid login returns 401 or error message; expired/invalid token on protected API returns 401 | |

---

**Notes**

- Dev credentials are seeded by the backend (see Backend README or `.env.example`). Do not rely on credentials shown in the UI; they were removed for security.
- For local dev, ensure `JWT_SECRET` is set in `Backend/.env` (see `Backend/.env.example`).
