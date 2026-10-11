import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const canSeeStats = user.role === "admin" || user.role === "hr";
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canSeeStats) return;
    api
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || err.message || "Failed to load dashboard")
      );
  }, [canSeeStats]);

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <p>Role: {user.role}</p>

      {!canSeeStats && <p>Your leave and attendance information will appear here in later weeks.</p>}

      {error && <p className="error">{error}</p>}
      {canSeeStats && !stats && !error && <p>Loading summary...</p>}

      {stats && (
        <>
          <div className="cards">
            <StatCard label="Total Employees" value={stats.total} />
            <StatCard label="Active" value={stats.active} />
            <StatCard label="Inactive" value={stats.inactive} />
            <StatCard label="Departments" value={stats.departments} />
          </div>

          <h3 className="section-title">Today&apos;s Attendance</h3>
          {stats.holidayToday && (
            <p className="success">
              <span className="badge holiday">Holiday</span> {stats.holidayToday}
            </p>
          )}
          <div className="cards">
            <StatCard label="Present" value={stats.attendanceToday.present} />
            <StatCard label="Late" value={stats.attendanceToday.late} />
            <StatCard label="Absent" value={stats.attendanceToday.absent} />
            <StatCard label="On leave" value={stats.attendanceToday.onLeave} />
            <StatCard label="Not marked" value={stats.attendanceToday.notMarked} />
          </div>
          <p>
            <Link to="/attendance">Open attendance &rarr;</Link>
          </p>

          <div className="panels">
            <section className="panel">
              <h3>Employees by Department</h3>
              {stats.byDepartment.length === 0 ? (
                <p>No data yet.</p>
              ) : (
                <div className="bars">
                  {stats.byDepartment.map((d) => (
                    <div className="bar-row" key={d.name}>
                      <span className="bar-label">{d.name}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${(d.count / Math.max(...stats.byDepartment.map((x) => x.count))) * 100}%` }}
                        />
                      </div>
                      <strong>{d.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h3>Recently Added</h3>
              {stats.recent.length === 0 ? (
                <p>No employees yet.</p>
              ) : (
                <ul className="plain-list">
                  {stats.recent.map((e) => (
                    <li key={e._id}>
                      <span>
                        {e.firstName} {e.lastName}
                      </span>
                      <small>{e.department?.name || "-"}</small>
                    </li>
                  ))}
                </ul>
              )}
              <p>
                <Link to="/employees">Manage employees &rarr;</Link>
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
