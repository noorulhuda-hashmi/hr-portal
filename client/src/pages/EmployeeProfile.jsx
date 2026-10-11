import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";
import DocumentsPanel from "../components/DocumentsPanel.jsx";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "-");

function Row({ label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-label">{label}</span>
      <span>{value || "-"}</span>
    </div>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [error, setError] = useState("");
  const [account, setAccount] = useState(null);
  const [password, setPassword] = useState("");
  const [accMsg, setAccMsg] = useState("");
  const [accErr, setAccErr] = useState("");

  const loadAccount = () =>
    api.get(`/employees/${id}/account`).then((res) => setAccount(res.data)).catch(() => {});

  const saveAccount = async () => {
    setAccMsg("");
    setAccErr("");
    if (password.length < 6) return setAccErr("Password must be at least 6 characters");
    try {
      if (account.exists) await api.put(`/employees/${id}/account`, { password });
      else await api.post(`/employees/${id}/account`, { password });
      setAccMsg(account.exists ? "Password reset" : "Login created");
      setPassword("");
      loadAccount();
    } catch (err) {
      setAccErr(err.response?.data?.message || err.message || "Could not save login");
    }
  };

  useEffect(() => {
    loadAccount();
  }, [id]);

  useEffect(() => {
    api
      .get(`/employees/${id}`)
      .then((res) => setEmp(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || err.message || "Failed to load employee")
      );
  }, [id]);

  return (
    <div>
      <p>
        <Link to="/employees">&larr; Back to employees</Link>
      </p>

      {error && <p className="error">{error}</p>}
      {!emp && !error && <p>Loading...</p>}

      {emp && (
        <div className="profile">
          <h2>
            {emp.firstName} {emp.lastName}{" "}
            <span className={`badge ${emp.status}`}>{emp.status}</span>
          </h2>

          <div className="profile-grid">
            <section className="panel">
              <h3>Personal</h3>
              <Row label="Employee ID" value={emp.employeeId} />
              <Row label="Date of birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : ""} />
              <Row label="Gender" value={emp.gender ? capitalize(emp.gender) : ""} />
              <Row label="Address" value={emp.address} />
            </section>

            <section className="panel">
              <h3>Contact</h3>
              <Row label="Email" value={emp.email} />
              <Row label="Phone" value={emp.phone} />
            </section>

            <section className="panel">
              <h3>Employment</h3>
              <Row label="Department" value={emp.department?.name} />
              <Row label="Designation" value={emp.designation} />
              <Row label="Joining date" value={formatDate(emp.joiningDate)} />
              <Row
                label="Salary"
                value={emp.salary !== undefined && emp.salary !== null ? emp.salary.toLocaleString() : ""}
              />
            </section>

            <section className="panel">
              <h3>Login account</h3>
              <Row label="Login email" value={account?.email} />
              <Row label="Has login" value={account ? (account.exists ? "Yes" : "No") : ""} />
              <div className="dept-add" style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder={account?.exists ? "New password" : "Set a password (min 6)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={saveAccount}>{account?.exists ? "Reset" : "Create login"}</button>
              </div>
              {accErr && <p className="error">{accErr}</p>}
              {accMsg && <p className="success">{accMsg}</p>}
            </section>
          </div>

          <DocumentsPanel
            urls={{
              list: `/employees/${id}/documents`,
              upload: `/employees/${id}/documents`,
              download: (d) => `/documents/${d._id}/download`,
              remove: (d) => `/documents/${d._id}`,
            }}
            canDelete={() => true}
          />
        </div>
      )}
    </div>
  );
}
