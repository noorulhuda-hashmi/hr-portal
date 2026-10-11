import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";

const money = (n) => Number(n || 0).toLocaleString();

function Line({ label, value, strong }) {
  return (
    <div className="profile-row">
      <span className="profile-label">{label}</span>
      {strong ? <strong>{value}</strong> : <span>{value}</span>}
    </div>
  );
}

// base: HR ke liye "/payroll", employee ke liye "/me/payslips"
export default function PayslipView({ base, back, backLabel }) {
  const { id } = useParams();
  const [slip, setSlip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`${base}/${id}`)
      .then((res) => setSlip(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load payslip"));
  }, [id, base]);

  const emp = slip?.employee;

  return (
    <div>
      <p className="no-print">
        <Link to={back}>&larr; {backLabel}</Link>
      </p>
      {error && <p className="error">{error}</p>}
      {!slip && !error && <p>Loading...</p>}

      {slip && (
        <div className="payslip panel">
          <h2>Payslip for {slip.month}</h2>
          <div className="profile-grid">
            <div>
              <Line label="Employee" value={`${emp.firstName} ${emp.lastName}`} />
              <Line label="Employee ID" value={emp.employeeId} />
              <Line label="Department" value={emp.department?.name || "-"} />
              <Line label="Designation" value={emp.designation || "-"} />
            </div>
            <div>
              <Line label="Status" value={slip.status === "paid" ? "Paid" : "Draft (not paid yet)"} />
              <Line label="Paid on" value={slip.paidAt ? new Date(slip.paidAt).toLocaleDateString() : "-"} />
            </div>
          </div>

          <h3>Earnings</h3>
          <Line label="Basic salary" value={money(slip.basicSalary)} />
          <Line label="Allowances" value={money(slip.allowances)} />
          <Line label="Bonus" value={money(slip.bonus)} />

          <h3>Deductions</h3>
          <Line label={`Absent (${slip.absentDays} day${slip.absentDays === 1 ? "" : "s"})`} value={money(slip.absentDeduction)} />
          <Line
            label={`Unpaid leave (${slip.unpaidLeaveDays} day${slip.unpaidLeaveDays === 1 ? "" : "s"})`}
            value={money(slip.unpaidLeaveDeduction)}
          />
          <Line label="Other deductions" value={money(slip.otherDeductions)} />

          <h3>Net salary</h3>
          <Line label="Net payable" value={money(slip.netSalary)} strong />
          {slip.note && <p className="hint">Note: {slip.note}</p>}

          <div className="actions no-print" style={{ marginTop: 16 }}>
            <button onClick={() => window.print()}>Print / Save as PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}
