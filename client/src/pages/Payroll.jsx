import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const money = (n) => Number(n || 0).toLocaleString();

export default function Payroll() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ allowances: "", bonus: "", otherDeductions: "", note: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = () =>
    api
      .get("/payroll", { params: { month } })
      .then((res) => setData(res.data))
      .catch((err) => setError(errorText(err, "Failed to load payroll")));

  useEffect(() => {
    if (month) {
      setError("");
      setMessage("");
      setEditingId(null);
      load();
    }
  }, [month]);

  const generate = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { data: r } = await api.post("/payroll/generate", { month });
      const parts = [`${r.created} created`, `${r.refreshed} refreshed`];
      if (r.skippedPaid) parts.push(`${r.skippedPaid} already paid`);
      if (r.skippedNoSalary) parts.push(`${r.skippedNoSalary} skipped (no salary set)`);
      setMessage(`Payroll for ${r.month}: ${parts.join(", ")}`);
      load();
    } catch (err) {
      setError(errorText(err, "Could not generate payroll"));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setDraft({ allowances: s.allowances, bonus: s.bonus, otherDeductions: s.otherDeductions, note: s.note || "" });
    setError("");
    setMessage("");
  };

  const save = async (s) => {
    setError("");
    for (const key of ["allowances", "bonus", "otherDeductions"]) {
      if (draft[key] === "" || Number(draft[key]) < 0 || Number.isNaN(Number(draft[key]))) {
        setError("Allowances, bonus and deductions must be numbers (0 or more)");
        return;
      }
    }
    try {
      await api.put(`/payroll/${s._id}`, draft);
      setMessage("Payslip updated");
      setEditingId(null);
      load();
    } catch (err) {
      setError(errorText(err, "Could not update payslip"));
    }
  };

  const pay = async (s) => {
    const name = `${s.employee.firstName} ${s.employee.lastName}`;
    if (!window.confirm(`Mark ${name}'s payslip (net ${money(s.netSalary)}) as PAID? It cannot be changed afterwards.`)) return;
    try {
      await api.post(`/payroll/${s._id}/pay`);
      setMessage("Marked as paid");
      load();
    } catch (err) {
      setError(errorText(err, "Could not mark as paid"));
    }
  };

  const remove = async (s) => {
    if (!window.confirm("Delete this draft payslip?")) return;
    try {
      await api.delete(`/payroll/${s._id}`);
      setMessage("Payslip deleted");
      load();
    } catch (err) {
      setError(errorText(err, "Could not delete payslip"));
    }
  };

  const num = (key) => (
    <input
      type="number"
      min="0"
      style={{ width: 90 }}
      value={draft[key]}
      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
    />
  );

  return (
    <div>
      <div className="toolbar">
        <h2>Payroll</h2>
        <label className="date-pick">
          Month
          <input type="month" value={month} max={thisMonth()} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <button disabled={busy} onClick={generate}>
          {busy ? "Working..." : "Generate / refresh"}
        </button>
      </div>

      <p className="hint">
        Basic salary comes from the employee record. Each absent day and each unpaid-leave day deducts 1/30 of the
        basic salary. Days not marked at all are not deducted. Refreshing re-reads attendance and leave for draft
        payslips only; paid payslips are never changed.
      </p>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {data && (
        <div className="cards">
          <div className="stat-card">
            <div className="stat-value">{data.slips.length}</div>
            <div className="stat-label">Payslips</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{money(data.totals.net)}</div>
            <div className="stat-label">Total net salary</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{money(data.totals.paid)}</div>
            <div className="stat-label">Already paid</div>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Basic</th>
            <th>Allowances</th>
            <th>Bonus</th>
            <th>Absent / Unpaid days</th>
            <th>Other ded.</th>
            <th>Net</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data && data.slips.length === 0 && (
            <tr>
              <td colSpan="9">No payslips for this month yet. Click Generate / refresh.</td>
            </tr>
          )}
          {data?.slips.map((s) => {
            const editing = editingId === s._id;
            return (
              <tr key={s._id}>
                <td>
                  {s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : "-"}
                  <br />
                  <small>{s.employee?.employeeId}</small>
                </td>
                <td>{money(s.basicSalary)}</td>
                <td>{editing ? num("allowances") : money(s.allowances)}</td>
                <td>{editing ? num("bonus") : money(s.bonus)}</td>
                <td>
                  {s.absentDays} / {s.unpaidLeaveDays}
                </td>
                <td>{editing ? num("otherDeductions") : money(s.otherDeductions)}</td>
                <td>
                  <strong>{money(s.netSalary)}</strong>
                </td>
                <td>
                  <span className={`badge ${s.status === "paid" ? "approved" : "pending"}`}>{s.status}</span>
                </td>
                <td>
                  <div className="row-actions">
                    {editing ? (
                      <>
                        <button onClick={() => save(s)}>Save</button>
                        <button className="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <Link className="btn-link" to={`/payroll/${s._id}`}>
                          View
                        </Link>
                        {s.status === "draft" && (
                          <>
                            <button className="secondary" onClick={() => startEdit(s)}>
                              Edit
                            </button>
                            <button onClick={() => pay(s)}>Mark paid</button>
                            <button className="danger" onClick={() => remove(s)}>
                              Delete
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
