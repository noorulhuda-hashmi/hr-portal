import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const money = (n) => Number(n || 0).toLocaleString();

export default function MyPayslips() {
  const [slips, setSlips] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/me/payslips")
      .then((res) => setSlips(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load payslips"));
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2>My Payslips</h2>
      </div>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Net salary</th>
            <th>Paid on</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slips && slips.length === 0 && (
            <tr>
              <td colSpan="4">No paid payslips yet.</td>
            </tr>
          )}
          {slips?.map((s) => (
            <tr key={s._id}>
              <td>{s.month}</td>
              <td>{money(s.netSalary)}</td>
              <td>{s.paidAt ? new Date(s.paidAt).toLocaleDateString() : "-"}</td>
              <td>
                <Link className="btn-link" to={`/my/payslips/${s._id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
