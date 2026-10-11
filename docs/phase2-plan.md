# Phase 2: Holidays, Payroll, Reports

## Holidays
- HR/admin adds and deletes public holidays (name + real calendar date, one per date). Everyone logged in can view them.
- On a holiday: the Attendance page shows "Holiday" instead of "Not marked", the HR dashboard shows the holiday,
  and employees cannot check in.

## Payroll
- Payslip per employee per month (unique), created as draft by "Generate / refresh".
- Basic salary is read from the employee record. Absent days (attendance marked absent) and approved unpaid-leave days
  each deduct 1/30 of basic. Days that were never marked are not deducted.
- HR can edit allowances, bonus, other deductions and a note on a draft. Net salary is always calculated by the server.
- Deductions can never exceed total earnings. "Mark paid" locks the payslip (no edit, no delete, no refresh).
- Payslip page can be printed or saved as PDF from the browser. Employees see only their own paid payslips.
- Not handled yet: tax slabs, mid-month joiners (pro-rata), working-day based salary.

## Reports
- Attendance (monthly), leave requests, employee list and payroll (monthly), each downloadable as CSV.
- CSV cells starting with = + - @ are prefixed so Excel does not run them as formulas.

## API
GET/POST/DELETE /api/holidays | GET /api/payroll?month= | POST /api/payroll/generate |
GET/PUT/DELETE /api/payroll/:id | POST /api/payroll/:id/pay | GET /api/reports/attendance?month= |
GET /api/me/payslips, GET /api/me/payslips/:id

# Phase 3a: Design, Notifications, Activity log
- New layout: left sidebar and top bar; on phones the sidebar becomes a Menu button. Dashboard shows a bar chart for employees by department.
- Notifications (bell in the top bar, refreshed every 30 seconds): HR is told about new leave requests; an employee is told when a leave is approved/rejected, when HR records a leave for them, and when a payslip is paid.
- Activity log (admin only, 20 per page): employees, logins, departments, leaves, payroll, holidays and attendance changes made by HR/admin.
- Logging and notifications never block the main action: if they fail, only a message is printed in the server window.
- Not built: forgot-password by email (needs an email service). HR can reset an employee's password from the employee profile.

# Phase 3b: Documents upload
- HR uploads documents on an employee's profile; employees upload and view their own under My Documents.
- Types: CNIC, contract, resume, certificate, other. Files: PDF, PNG, JPG, up to 2 MB, maximum 10 per employee.
- The file type is checked from the file's first bytes (not just the name), names are cleaned, and downloads are sent as attachments.
- Files are stored in the database (fine for small files). For many or large files a storage service (such as S3) would be better later.
- Employees can delete only files they uploaded themselves; HR can delete any. Uploads and deletes appear in the activity log.
