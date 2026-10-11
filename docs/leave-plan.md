# Leave Management Module (Week 8)

## Requirements
- HR/admin can record a leave request for an active employee.
- Leave types: annual, sick, casual, unpaid.
- Each request has start date, end date, reason and a status (pending, approved, rejected).
- HR/admin reviews pending requests: approve, or reject with a note.

## Data (Leave collection)
employee (ref Employee), leaveType, startDate, endDate ("YYYY-MM-DD"), reason (5-300 chars),
status (default pending), reviewNote, reviewedBy (ref User), reviewedAt. `days` is calculated.
Deleting an employee also deletes their leave requests.

## Workflow
pending -> approved | rejected. A decided request cannot be changed again; only pending requests can be deleted.

## Validation
- Required: employee, type, both dates, reason.
- Both dates must be real calendar dates; end date not before start date; maximum 30 days per request.
- Dates must not overlap another pending/approved leave of the same employee.
- Rejection needs a note.
Checked in the React form (field-level) and again on the server.

## API (admin/hr only)
GET /api/leaves?status= | POST /api/leaves | PATCH /api/leaves/:id/review | DELETE /api/leaves/:id

## Attendance integration (done)
- An employee with approved leave on a day and no attendance record is shown as "On leave" (not "Not marked") on the Attendance page and the HR dashboard.
- Employees cannot check in on a day of approved leave.

## Leave balance (done)
Yearly allowance: annual 14, sick 10, casual 8, unpaid unlimited (see server/src/utils/leaveBalance.js).
Pending and approved requests both count, so a request that exceeds the balance is refused.
Days are calendar days (weekends included); a request that crosses a year end is split per year.

## Employee dashboard and self check-in (done)
Employee home shows today's status with Check in / Check out buttons (time taken from the server clock),
this month's present/late/absent, pending requests, leave balance and upcoming approved leave.

## Still planned
- Automated tests for the full leave lifecycle, working-day calculation and public holidays.

## Employee self-service (added)
- HR/admin creates a login for an employee from the employee's profile page (login email = employee email).
- Employee logs in and sees: My Profile, My Attendance (by month), My Leaves (apply, track, cancel pending), Password.
- Employee endpoints are under /api/me and always use the employee linked to the logged-in user.
