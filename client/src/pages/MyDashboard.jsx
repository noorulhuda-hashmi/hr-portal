import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const TYPE_LABEL = { annual: "Annual", sick: "Sick", casual: "Casual", unpaid: "Unpaid" };

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function MyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = () =>
    api
      .get("/me/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(errorText(err, "Failed to load dashboard")));

  useEffect(() => {
    load();
  }, []);

  const punch = async (kind) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api.post(`/me/${kind}`);
      setMessage(kind === "checkin" ? "Checked in. Have a good day!" : "Checked out. See you tomorrow!");
      await load();
    } catch (err) {
      setError(errorText(err, "Could not save attendance"));
    } finally {
      setBusy(false);
    }
  };

  const rec = data?.todayRecord;

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      {!data && !error && <p>Loading...</p>}

      {data && (
        <>
          <section className="panel today-panel">
            <h3>Today ({data.today})</h3>
            {data.holidayToday && !rec ? (
              <p>
                <span className="badge holiday">Holiday</span> Today is a holiday: {data.holidayToday}.
              </p>
            ) : data.onLeaveToday && !rec ? (
              <p>
                <span className="badge onleave">On leave</span> You have approved leave today.
              </p>
            ) : (
              <>
                <div className="profile-row">
                  <span className="profile-label">Check-in</span>
                  <span>{rec?.checkIn || "-"}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Check-out</span>
                  <span>{rec?.checkOut || "-"}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Status</span>
                  <span>
                    {rec ? <span className={`badge ${rec.status}`}>{rec.status}</span> : "Not checked in"}
                  </span>
                </div>
                <div className="actions" style={{ marginTop: 12 }}>
                  <button disabled={busy || !!rec} onClick={() => punch("checkin")}>
                    Check in
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || !rec?.checkIn || !!rec?.checkOut}
                    onClick={() => punch("checkout")}
                  >
                    Check out
                  </button>
                </div>
                <p className="hint" style={{ marginTop: 8 }}>
                  Check-in after {data.lateAfter} is counted as late.
                </p>
              </>
            )}
          </section>

          <h3 className="section-title">This month ({data.month})</h3>
          <div className="cards">
            <StatCard label="Present" value={data.summary.present} />
            <StatCard label="Late" value={data.summary.late} />
            <StatCard label="Absent" value={data.summary.absent} />
            <StatCard label="Pending leave requests" value={data.pendingLeaves} />
          </div>

          <div className="panels">
            <section className="panel">
              <h3>Leave balance {data.balance.year}</h3>
              <ul className="plain-list">
                {data.balance.balances.map((b) => (
                  <li key={b.type}>
                    <span>{TYPE_LABEL[b.type]}</span>
                    <strong>
                      {b.remaining === null ? `${b.approved} used` : `${b.remaining} of ${b.allowance} left`}
                    </strong>
                  </li>
                ))}
              </ul>
              <p>
                <Link to="/my/leaves">Apply for leave &rarr;</Link>
              </p>
            </section>

            <section className="panel">
              <h3>Upcoming holidays</h3>
              {data.nextHolidays.length === 0 ? (
                <p>None added yet.</p>
              ) : (
                <ul className="plain-list">
                  {data.nextHolidays.map((h) => (
                    <li key={h._id}>
                      <span>{h.name}</span>
                      <small>{h.date}</small>
                    </li>
                  ))}
                </ul>
              )}
              <p>
                <Link to="/holidays">All holidays &rarr;</Link>
              </p>
            </section>

            <section className="panel">
              <h3>Upcoming approved leave</h3>
              {data.upcoming.length === 0 ? (
                <p>None.</p>
              ) : (
                <ul className="plain-list">
                  {data.upcoming.map((l) => (
                    <li key={l._id}>
                      <span>
                        {l.startDate} to {l.endDate}
                      </span>
                      <small>{TYPE_LABEL[l.leaveType]}</small>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
