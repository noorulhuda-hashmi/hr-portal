import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : "-");

function Row({ label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-label">{label}</span>
      <span>{value || "-"}</span>
    </div>
  );
}

export default function MyProfile() {
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/me/profile")
      .then((res) => setEmp(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load profile"));
  }, []);

  return (
    <div className="profile">
      <h2>Welcome, {user.name}</h2>
      {error && <p className="error">{error}</p>}
      {!emp && !error && <p>Loading...</p>}
      {emp && (
        <div className="profile-grid">
          <section className="panel">
            <h3>Personal</h3>
            <Row label="Employee ID" value={emp.employeeId} />
            <Row label="Date of birth" value={emp.dateOfBirth ? formatDate(emp.dateOfBirth) : ""} />
            <Row label="Gender" value={emp.gender} />
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
            <Row label="Status" value={emp.status} />
          </section>
        </div>
      )}
    </div>
  );
}
