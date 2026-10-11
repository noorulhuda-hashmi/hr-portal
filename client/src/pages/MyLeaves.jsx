import { useEffect, useState } from "react";
import api from "../services/api.js";

const TYPE_LABEL = { annual: "Annual", sick: "Sick", casual: "Casual", unpaid: "Unpaid" };
const EMPTY = { leaveType: "annual", startDate: "", endDate: "", reason: "" };

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = () => {
    api
      .get("/me/leave-balance")
      .then((res) => setBalance(res.data))
      .catch(() => {});
    return api
      .get("/me/leaves")
      .then((res) => setLeaves(res.data))
      .catch((err) => setError(errorText(err, "Failed to load leaves")));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setFieldErrors({ ...fieldErrors, [key]: "" });
  };

  const validate = () => {
    const e = {};
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
      await api.post("/me/leaves", { ...form, reason: form.reason.trim() });
      setMessage("Leave request submitted. HR will review it.");
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(errorText(err, "Could not submit leave request"));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (leave) => {
    if (!window.confirm("Cancel this pending leave request?")) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/me/leaves/${leave._id}`);
      setMessage("Leave request cancelled");
      load();
    } catch (err) {
      setError(errorText(err, "Could not cancel leave"));
    }
  };

  return (
    <div>
      <div className="toolbar"><h2>My Leaves</h2></div>

      {balance && (
        <div className="cards">
          {balance.balances.map((b) => (
            <div className="stat-card" key={b.type}>
              <div className="stat-value">{b.remaining === null ? b.approved : b.remaining}</div>
              <div className="stat-label">
                {TYPE_LABEL[b.type]} {b.remaining === null ? "days used" : `days left of ${b.allowance}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>Apply for leave</h3>
        <div className="form-grid">
          <div className="field">
            <span className="field-label">Leave type</span>
            <select value={form.leaveType} onChange={set("leaveType")}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
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
          <input type="text" placeholder="Why do you need leave?" value={form.reason} onChange={set("reason")} className={fieldErrors.reason ? "invalid" : ""} />
          {fieldErrors.reason && <span className="field-error">{fieldErrors.reason}</span>}
        </div>
        <div className="actions">
          <button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit request"}</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <table>
        <thead>
          <tr><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {leaves.length === 0 && <tr><td colSpan="7">You have not applied for any leave yet.</td></tr>}
          {leaves.map((l) => (
            <tr key={l._id}>
              <td>{TYPE_LABEL[l.leaveType]}</td>
              <td>{l.startDate}</td>
              <td>{l.endDate}</td>
              <td>{l.days}</td>
              <td>
                {l.reason}
                {l.reviewNote && (<><br /><small>HR note: {l.reviewNote}</small></>)}
              </td>
              <td><span className={`badge ${l.status}`}>{l.status}</span></td>
              <td>
                {l.status === "pending" ? (
                  <button className="secondary" onClick={() => cancel(l)}>Cancel</button>
                ) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
