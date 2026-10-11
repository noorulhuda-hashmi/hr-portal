# HR Portal (MERN)

A human-resources web app built with MongoDB, Express, React and Node.

## Features
- **Roles:** admin, HR, employee (each sees only what they should)
- **Employees and departments:** add/edit/search, profiles, login accounts for employees, documents (PDF/PNG/JPG)
- **Attendance:** HR marks daily; employees check in/out themselves; late/absent rules; On Leave and Holiday handling
- **Leaves:** request, approve/reject with a note, yearly balance per type, overlap and balance checks
- **Payroll:** monthly payslips with allowances, bonus, deductions from absences and unpaid leave, print/save as PDF
- **Holidays, reports with CSV export, notifications bell, admin activity log**
- **Security:** hashed passwords, JWT, role checks on every route, login rate limit, security headers,
  input sanitising, file type checked by content

## Run on your PC
1. Install Node.js (LTS) and create a free MongoDB Atlas database.
2. `server/.env` (copy `server/.env.example`): set `MONGO_URI`, `JWT_SECRET` (16+ characters), etc.
3. In two terminals:
   - `cd server` then `npm install` then `npm run dev`
   - `cd client` then `npm install` then `npm run dev` and open http://localhost:5173
4. First admin: put `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` and run `npm run seed` in `server`.

## Tests
`cd server` then `npm test`. 36 tests run without a database: validation rules, payroll and leave-balance
maths, security (401/403 on every protected route, input injection, uploads).

## Project layout
```
client/   React + Vite (pages, components, services)
server/   Express API (routes > controllers > models, middleware, utils, tests)
docs/     planning notes and deployment guide
```

## Deploying
See `docs/deployment.md`.

## Known limits
- No email (so no "forgot password"; HR resets passwords from the employee profile).
- Leave days are calendar days; payroll has no tax slabs or pro-rata for mid-month joiners.
- Files live in MongoDB (fine for small documents).
- `npm audit` reports issues only in `nodemon` (a development tool, not part of production).
