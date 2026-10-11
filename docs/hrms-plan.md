# HR Portal -> HRMS: Planning Notes (Week 6)

**Intern:** Noor Ul Huda Hashmi  |  **Project:** HR Portal (MERN Stack)

## 1. Goal

Expand the basic HR Portal (login, employee records, dashboard) into a more complete
Human Resource Management System (HRMS) that covers the employee lifecycle:
joining, day-to-day information, department/role changes, and status changes.

## 2. Review of the existing structure

| Layer | What exists now |
|---|---|
| Database (MongoDB) | `User`, `Employee`, `Department` collections |
| Backend (Express) | auth, employees (CRUD + search), departments, dashboard stats |
| Frontend (React) | Login, Dashboard, Employees list + form |

The code is organised as routes -> controllers -> models, so new HR features can be added
as new modules without changing the existing ones.

## 3. Essential employee information (employee profile)

| Group | Fields |
|---|---|
| Identity | employeeId, firstName, lastName |
| Personal | dateOfBirth, gender, address |
| Contact | email, phone |
| Employment | department, designation, joiningDate, salary |
| Status | status (active / inactive) |

Decision: keep all of this in a single `Employee` document for now. It is simple to query
and is enough for the current scope.

## 4. Department and designation management (plan)

**Departments**
- List all departments with the number of employees in each.
- Create, rename, and delete a department.
- A department that still has employees cannot be deleted (protects data).

**Designations (planned, next step)**
- Today designation is free text on the employee.
- Plan: create a `Designation` collection (title, department, level) and let the employee
  form pick from a list, so job titles stay consistent and can be reported on.
- Open question: should a designation belong to one department or be shared? Decision
  pending (leaning towards "belongs to one department").

## 5. Integration requirements

- React pages talk to the Express API through one shared Axios instance (`services/api.js`).
- Every new API route is protected with JWT and role checks (`admin`, `hr`).
- New collections reference each other by ObjectId (e.g. employee -> department).
- Validation is done twice: in the form (quick feedback) and in the Mongoose model (safety).

## 6. Next development priorities

1. Leave management (apply, approve / reject, history)
2. Attendance (check-in / check-out, history)
3. Designation management (see section 4)
4. Employee self-service view (an employee sees only their own profile)
5. Final testing, cleanup, and documentation
