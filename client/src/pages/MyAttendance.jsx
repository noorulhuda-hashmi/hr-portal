import { useEffect, useState } from "react";
import api from "../services/api.js";

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function MyAttendance() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!month) return;
    setError("");
    api
      .get("/me/attendance", { params: { month } })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load attendance"));
  }, [month]);

  return (
    <div>
      <div className="toolbar">
        <h2>My Attendance</h2>
        <label className="date-pick">
          Month
          <input type="month" value={month} max={thisMonth()} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {data && (
        <div className="cards">
          <div className="stat-card"><div className="stat-value">{data.summary.present}</div><div className="stat-label">Present</div></div>
          <div className="stat-card"><div className="stat-value">{data.summary.late}</div><div className="stat-label">Late</div></div>
          <div className="stat-card"><div className="stat-value">{data.summary.absent}</div><div className="stat-label">Absent</div></div>
        </div>
      )}

      <table>
        <thead>
          <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr>
        </thead>
        <tbody>
          {data && data.records.length === 0 && (
            <tr><td colSpan="4">No attendance recorded for this month.</td></tr>
          )}
          {data?.records.map((r) => (
            <tr key={r._id}>
              <td>{r.date}</td>
              <td>{r.checkIn || "-"}</td>
              <td>{r.checkOut || "-"}</td>
              <td><span className={`badge ${r.status}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
