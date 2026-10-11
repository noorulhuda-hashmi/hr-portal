# HR Portal – Requirements & Planning (Week 1)

**Project:** HR Portal (Self-Directed Proposed Project)
**Stack:** MongoDB, Express.js, React.js, Node.js (MERN)
**Intern:** Noor Ul Huda Hashmi
**Organization:** FLEACT TECH (PRIVATE) LIMITED
**Supervisor:** Muhammad Salman Latif

---

## 1. Purpose

HR Portal ek web application hai jis ka maqsad company ki basic HR operations
(employee records, attendance, leave management) ko ek jagah digital tareeqe se manage karna hai.

## 2. Scope (Phase 1 – Planned)

**In scope**
- User authentication (register/login/logout) with JWT
- Role-based access: `admin`, `hr`, `employee`
- Employee management (add, view, update, delete)
- Employee-related information (personal info, department, designation, joining date, salary)
- Basic HR operations: leave requests and approvals, attendance records, department listing

**Out of scope (for now)**
- Payroll calculation, payslip generation
- Email notifications
- Recruitment / applicant tracking

## 3. User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access; manage users, employees, departments, leaves |
| HR | Manage employees, approve/reject leaves, view attendance |
| Employee | View own profile, apply for leave, view own attendance |

## 4. Main Modules

1. **Authentication Module** – register, login, JWT token, protected routes, role check
2. **Employee Management Module** – CRUD for employee records, search/filter
3. **Department Module** – create and list departments
4. **Leave Management Module** – apply, approve/reject, leave history
5. **Attendance Module** – check-in/check-out, attendance history
6. **Dashboard Module** – summary counts (employees, pending leaves, present today)

## 5. Functional Requirements

- FR1: User system mein login kar sake aur role ke mutabiq pages dekhe.
- FR2: Admin/HR naya employee add kar sake.
- FR3: Admin/HR employee ki details update ya delete kar sake.
- FR4: Employee apni profile dekh sake.
- FR5: Employee leave request submit kar sake.
- FR6: HR leave request approve ya reject kar sake.
- FR7: Employee check-in/check-out kar sake aur history dekh sake.
- FR8: Dashboard par summary figures nazar aayen.

## 6. Non-Functional Requirements

- Passwords bcrypt se hashed hon.
- API routes JWT se protected hon.
- Responsive UI.
- Clean, modular code structure (routes / controllers / models separated).

## 7. Data Models (initial plan)

- **User:** name, email, password, role
- **Employee:** user (ref), employeeId, phone, department (ref), designation, joiningDate, salary, status
- **Department:** name, description
- **Leave:** employee (ref), type, startDate, endDate, reason, status, reviewedBy
- **Attendance:** employee (ref), date, checkIn, checkOut

## 8. API Plan (planned endpoints)

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Employees | `GET/POST /api/employees`, `GET/PUT/DELETE /api/employees/:id` |
| Departments | `GET/POST /api/departments` |
| Leaves | `GET/POST /api/leaves`, `PATCH /api/leaves/:id/status` |
| Attendance | `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `GET /api/attendance` |

## 9. User Flow

```
Visitor -> Login Page -> (JWT issued)
   |
   +--> Admin/HR Dashboard
   |       +--> Employees (list / add / edit / delete)
   |       +--> Departments
   |       +--> Leave Requests (approve / reject)
   |       +--> Attendance Overview
   |
   +--> Employee Dashboard
           +--> My Profile
           +--> Apply Leave / My Leaves
           +--> Check-in / Check-out / My Attendance
```

## 10. Application Structure

```
hr-portal/
├── client/   (React + Vite)   -> pages, components, services, context
├── server/   (Node + Express) -> config, models, controllers, routes, middleware
└── docs/     -> requirements and planning notes
```

## 11. Week-by-Week Plan (tentative)

| Week | Focus |
|------|-------|
| 1 | Requirements, planning, environment setup, project structure |
| 2 | Backend: database connection, models, authentication |
| 3 | Backend: employee, department APIs |
| 4 | Frontend: setup, login, routing, layouts |
| 5 | Frontend: employee management pages |
| 6 | Leave and attendance modules |
| 7 | Dashboard, validation, testing |
| 8 | Final polish, documentation |
