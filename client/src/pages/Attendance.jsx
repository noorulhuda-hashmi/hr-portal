import { useEffect, useState } from "react";
import api from "../services/api.js";

const todayString = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const STATUS_LABEL = { present: "Present", late: "Late", absent: "Absent" };

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Attendance() {
  const [date, setDate] = useState(todayString());
  const [data, setData] = useState(null);
  const [editingId, setEditingId] = useState(null); // jis employee ki row edit ho rahi hai
  const [draft, setDraft] = useState({ checkIn: "", checkOut: "", status: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = async (day = date) => {
    try {
      const res = await api.get("/attendance", { params: { date: day } });
      setData(res.data);
    } catch (err) {
      setError(errorText(err, "Failed to load attendance"));
    }
  };

  useEffect(() => {
    if (date) load(date);
  }, [date]);

  const startEdit = (row) => {
    setEditingId(row.employee._id);
    setDraft({
      checkIn: row.record?.checkIn || "",
      checkOut: row.record?.checkOut || "",
      status: row.record?.status || "",
    });
    setError("");
    setMessage("");
  };

  const cancelEdit = () => setEditingId(null);

  const handleSave = async (row) => {
    setError("");
    setMessage("");

    // Server bhi check karta hai, yahan jaldi feedback ke liye
    if (draft.checkOut && !draft.checkIn) {
      setError("Check-out needs a check-in time");
      return;
    }
    if (draft.checkIn && draft.checkOut && draft.checkOut <= draft.checkIn) {
      setError("Check-out must be after check-in");
      return;
    }
    if (draft.status === "absent" && (draft.checkIn || draft.checkOut)) {
      setError("An absent record cannot have check-in or check-out times");
      return;
    }

    setSaving(true);
    try {
      await api.post("/attendance", {
        employee: row.employee._id,
        date,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        status: draft.status,
      });
      setMessage("Attendance saved");
      setEditingId(null);
      load();
    } catch (err) {
      setError(errorText(err, "Could not save attendance"));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async (row) => {
    if (!window.confirm(`Clear attendance of ${row.employee.firstName} for ${date}?`)) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/attendance/${row.record._id}`);
      setMessage("Attendance cleared");
      load();
    } catch (err) {
      setError(errorText(err, "Could not clear attendance"));
    }
  };

  const s = data?.summary;

  return (
    <div>
      <div className="toolbar">
        <h2>Attendance</h2>
        <label className="date-pick">
          Date
          <input
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
      </div>

      {data?.holiday && (
        <p className="success">
          <span className="badge holiday">Holiday</span> {data.holiday}: attendance is not required today.
        </p>
      )}

      {data && (
        <p className="hint">
          Check-in after <strong>{data.lateAfter}</strong> is counted as late (if you leave the status on
          Auto).
        </p>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {s && (
        <div className="cards">
          <StatCard label="Present" value={s.present} />
          <StatCard label="Late" value={s.late} />
          <StatCard label="Absent" value={s.absent} />
          <StatCard label="On leave" value={s.onLeave} />
          <StatCard label="Not marked" value={s.notMarked} />
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data && data.rows.length === 0 && (
            <tr>
              <td colSpan="7">No active employees yet. Add employees first.</td>
            </tr>
          )}
          {data?.rows.map((row) => {
            const e = row.employee;
            const r = row.record;
            const editing = editingId === e._id;

            return (
              <tr key={e._id}>
                <td>{e.employeeId}</td>
                <td>
                  {e.firstName} {e.lastName}
                </td>
                <td>{e.department?.name || "-"}</td>

                {editing ? (
                  <>
                    <td>
                      <input
                        type="time"
                        value={draft.checkIn}
                        onChange={(ev) => setDraft({ ...draft, checkIn: ev.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={draft.checkOut}
                        onChange={(ev) => setDraft({ ...draft, checkOut: ev.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={draft.status}
                        onChange={(ev) => setDraft({ ...draft, status: ev.target.value })}
                      >
                        <option value="">Auto</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                      </select>
                    </td>
                    <td className="row-actions">
                      <button disabled={saving} onClick={() => handleSave(row)}>
                        Save
                      </button>
                      <button className="secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r?.checkIn || "-"}</td>
                    <td>{r?.checkOut || "-"}</td>
                    <td>
                      {r ? (
                        <span className={`badge ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                      ) : data.holiday ? (
                        <span className="badge holiday">Holiday</span>
                      ) : row.onLeave ? (
                        <span className="badge onleave">On leave</span>
                      ) : (
                        <span className="badge notmarked">Not marked</span>
                      )}
                    </td>
                    <td className="row-actions">
                      <button className="secondary" onClick={() => startEdit(row)}>
                        {r ? "Edit" : "Mark"}
                      </button>
                      {r && (
                        <button className="danger" onClick={() => handleClear(row)}>
                          Clear
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
