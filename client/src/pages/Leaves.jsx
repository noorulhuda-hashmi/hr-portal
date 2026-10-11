import { useEffect, useState } from "react";
import api from "../services/api.js";

const TYPE_LABEL = { annual: "Annual", sick: "Sick", casual: "Casual", unpaid: "Unpaid" };
const EMPTY = { employee: "", leaveType: "annual", startDate: "", endDate: "", reason: "" };
const TABS = ["all", "pending", "approved", "rejected"];

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = async (tab = filter) => {
    try {
      const params = tab === "all" ? {} : { status: tab };
      const { data } = await api.get("/leaves", { params });
      setLeaves(data);
    } catch (err) {
      setError(errorText(err, "Failed to load leave requests"));
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  useEffect(() => {
    api
      .get("/employees", { params: { status: "active" } })
      .then(({ data }) => setEmployees(data))
      .catch((err) => setError(errorText(err, "Failed to load employees")));
  }, []);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setFieldErrors({ ...fieldErrors, [key]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.employee) e.employee = "Choose an employee";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = "End date cannot be before start date";
    if (form.reason.trim().length < 5) e.reason = "Reason must be at least 5 characters";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setMessage("");
    const e = validate();
    setFieldErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await api.post("/leaves", { ...form, reason: form.reason.trim() });
      setMessage("Leave request submitted");
      setForm(EMPTY);
      setFilter("pending");
      load("pending");
    } catch (err) {
      setError(errorText(err, "Could not submit leave request"));
    } finally {
      setSaving(false);
    }
  };

  const review = async (leave, status) => {
    setError("");
    setMessage("");
    let reviewNote = "";
    if (status === "rejected") {
      reviewNote = window.prompt("Reason for rejecting this leave:") || "";
      if (!reviewNote.trim()) {
        setError("A note is required to reject a leave");
        return;
      }
    }
    try {
      await api.patch(`/leaves/${leave._id}/review`, { status, reviewNote });
      setMessage(`Leave ${status}`);
      load();
    } catch (err) {
      setError(errorText(err, "Could not update leave"));
    }
  };

  const remove = async (leave) => {
    if (!window.confirm("Delete this pending leave request?")) return;
    try {
      await api.delete(`/leaves/${leave._id}`);
      setMessage("Leave request deleted");
      load();
    } catch (err) {
      setError(errorText(err, "Could not delete leave"));
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h2>Leave Management</h2>
      </div>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>New leave request</h3>
        <div className="form-grid">
          <div className="field">
            <span className="field-label">Employee</span>
            <select value={form.employee} onChange={set("employee")} className={fieldErrors.employee ? "invalid" : ""}>
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.employeeId} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
            {fieldErrors.employee && <span className="field-error">{fieldErrors.employee}</span>}
          </div>
          <div className="field">
            <span className="field-label">Leave type</span>
            <select value={form.leaveType} onChange={set("leaveType")}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Start date</span>
            <input type="date" value={form.startDate} onChange={set("startDate")} className={fieldErrors.startDate ? "invalid" : ""} />
            {fieldErrors.startDate && <span className="field-error">{fieldErrors.startDate}</span>}
          </div>
          <div className="field">
            <span className="field-label">End date</span>
            <input type="date" value={form.endDate} onChange={set("endDate")} className={fieldErrors.endDate ? "invalid" : ""} />
            {fieldErrors.endDate && <span className="field-error">{fieldErrors.endDate}</span>}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Reason</span>
          <input type="text" placeholder="Why is the leave needed?" value={form.reason} onChange={set("reason")} className={fieldErrors.reason ? "invalid" : ""} />
          {fieldErrors.reason && <span className="field-error">{fieldErrors.reason}</span>}
        </div>
        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === filter ? "tab active" : "tab"} onClick={() => setFilter(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 && (
            <tr>
              <td colSpan="8">No leave requests here.</td>
            </tr>
          )}
          {leaves.map((l) => (
            <tr key={l._id}>
              <td>
                {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "-"}
                <br />
                <small>{l.employee?.employeeId}</small>
              </td>
              <td>{TYPE_LABEL[l.leaveType]}</td>
              <td>{l.startDate}</td>
              <td>{l.endDate}</td>
              <td>{l.days}</td>
              <td>
                {l.reason}
                {l.reviewNote && (
                  <>
                    <br />
                    <small>Note: {l.reviewNote}</small>
                  </>
                )}
              </td>
              <td>
                <span className={`badge ${l.status}`}>{l.status}</span>
              </td>
              <td>
                {l.status === "pending" ? (
                  <div className="row-actions">
                    <button onClick={() => review(l, "approved")}>Approve</button>
                    <button className="danger" onClick={() => review(l, "rejected")}>
                      Reject
                    </button>
                    <button className="secondary" onClick={() => remove(l)}>
                      Delete
                    </button>
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
