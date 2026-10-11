import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekday = (dateStr) => WEEKDAYS[new Date(`${dateStr}T00:00:00`).getDay()];

export default function Holidays() {
  const { user } = useAuth();
  const canManage = user.role === "admin" || user.role === "hr";
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({ name: "", date: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = () =>
    api
      .get("/holidays", { params: { year } })
      .then((res) => setHolidays(res.data))
      .catch((err) => setError(errorText(err, "Failed to load holidays")));

  useEffect(() => {
    load();
  }, [year]);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    setError("");
    setMessage("");
    const e = {};
    if (form.name.trim().length < 2) e.name = "Holiday name must be at least 2 characters";
    if (!form.date) e.date = "Date is required";
    setFieldErrors(e);
    if (Object.keys(e).length) return;
    try {
      await api.post("/holidays", { name: form.name.trim(), date: form.date });
      setMessage("Holiday added");
      setForm({ name: "", date: "" });
      setYear(Number(form.date.slice(0, 4)));
      load();
    } catch (err) {
      setError(errorText(err, "Could not add holiday"));
    }
  };

  const remove = async (h) => {
    if (!window.confirm(`Delete "${h.name}"?`)) return;
    try {
      await api.delete(`/holidays/${h._id}`);
      setMessage("Holiday deleted");
      load();
    } catch (err) {
      setError(errorText(err, "Could not delete holiday"));
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h2>Holidays</h2>
        <label className="date-pick">
          Year
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => e.target.value && setYear(Number(e.target.value))}
          />
        </label>
      </div>

      {canManage && (
        <form className="card form-card" onSubmit={handleAdd} noValidate>
          <h3>Add holiday</h3>
          <div className="form-grid">
            <div className="field">
              <span className="field-label">Holiday name</span>
              <input
                type="text"
                placeholder="e.g. Eid ul Fitr"
                value={form.name}
                className={fieldErrors.name ? "invalid" : ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <span className="field-label">Date</span>
              <input
                type="date"
                value={form.date}
                className={fieldErrors.date ? "invalid" : ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
            </div>
          </div>
          <div className="actions">
            <button type="submit">Add holiday</button>
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Holiday</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {holidays.length === 0 && (
            <tr>
              <td colSpan={canManage ? 4 : 3}>No holidays for {year}.</td>
            </tr>
          )}
          {holidays.map((h) => (
            <tr key={h._id}>
              <td>{h.date}</td>
              <td>{weekday(h.date)}</td>
              <td>{h.name}</td>
              {canManage && (
                <td>
                  <button className="danger" onClick={() => remove(h)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
