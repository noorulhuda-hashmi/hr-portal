import { useEffect, useState } from "react";
import api from "../services/api.js";
import { downloadCsv } from "../utils/csv.js";

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const REPORTS = {
  attendance: {
    label: "Attendance (monthly)",
    monthly: true,
    columns: [
      { header: "Employee ID", value: (r) => r.employeeId },
      { header: "Name", value: (r) => r.name },
      { header: "Department", value: (r) => r.department },
      { header: "Present", value: (r) => r.present },
      { header: "Late", value: (r) => r.late },
      { header: "Absent", value: (r) => r.absent },
      { header: "Leave days", value: (r) => r.leaveDays },
    ],
  },
  leaves: {
    label: "Leave requests",
    monthly: false,
    columns: [
      { header: "Employee ID", value: (r) => r.employee?.employeeId },
      { header: "Name", value: (r) => (r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "") },
      { header: "Type", value: (r) => r.leaveType },
      { header: "From", value: (r) => r.startDate },
      { header: "To", value: (r) => r.endDate },
      { header: "Days", value: (r) => r.days },
      { header: "Status", value: (r) => r.status },
      { header: "Reason", value: (r) => r.reason },
    ],
  },
  employees: {
    label: "Employee list",
    monthly: false,
    columns: [
      { header: "Employee ID", value: (r) => r.employeeId },
      { header: "First name", value: (r) => r.firstName },
      { header: "Last name", value: (r) => r.lastName },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "Department", value: (r) => r.department?.name },
      { header: "Designation", value: (r) => r.designation },
      { header: "Joining date", value: (r) => (r.joiningDate ? r.joiningDate.slice(0, 10) : "") },
      { header: "Status", value: (r) => r.status },
    ],
  },
  payroll: {
    label: "Payroll (monthly)",
    monthly: true,
    columns: [
      { header: "Employee ID", value: (r) => r.employee?.employeeId },
      { header: "Name", value: (r) => (r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "") },
      { header: "Basic", value: (r) => r.basicSalary },
      { header: "Allowances", value: (r) => r.allowances },
      { header: "Bonus", value: (r) => r.bonus },
      { header: "Absent deduction", value: (r) => r.absentDeduction },
      { header: "Unpaid leave deduction", value: (r) => r.unpaidLeaveDeduction },
      { header: "Other deductions", value: (r) => r.otherDeductions },
      { header: "Net salary", value: (r) => r.netSalary },
      { header: "Status", value: (r) => r.status },
    ],
  },
};

export default function Reports() {
  const [kind, setKind] = useState("attendance");
  const [month, setMonth] = useState(thisMonth());
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const report = REPORTS[kind];

  useEffect(() => {
    setRows(null);
    setError("");
    const params = { month };
    const request = {
      attendance: () => api.get("/reports/attendance", { params }).then((r) => r.data.rows),
      leaves: () => api.get("/leaves").then((r) => r.data),
      employees: () => api.get("/employees").then((r) => r.data),
      payroll: () => api.get("/payroll", { params }).then((r) => r.data.slips),
    }[kind];
    request()
      .then(setRows)
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load report"));
  }, [kind, month]);

  const handleDownload = () => {
    const name = `${kind}${report.monthly ? `-${month}` : ""}.csv`;
    downloadCsv(name, report.columns, rows);
  };

  return (
    <div>
      <div className="toolbar">
        <h2>Reports</h2>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {Object.entries(REPORTS).map(([key, r]) => (
            <option key={key} value={key}>
              {r.label}
            </option>
          ))}
        </select>
        {report.monthly && (
          <label className="date-pick">
            Month
            <input type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </label>
        )}
        <button disabled={!rows || rows.length === 0} onClick={handleDownload}>
          Download CSV
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {!rows && !error && <p>Loading...</p>}

      {rows && (
        <table>
          <thead>
            <tr>
              {report.columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={report.columns.length}>No data for this report.</td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r._id || r.employeeId || i}>
                {report.columns.map((c) => (
                  <td key={c.header}>{c.value(r) ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
