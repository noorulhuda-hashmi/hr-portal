import { useEffect, useState } from "react";
import api from "../services/api.js";

export default function Activity() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/activity", { params: { page } })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load activity"));
  }, [page]);

  return (
    <div>
      <div className="toolbar">
        <h2>Activity log</h2>
      </div>
      <p className="hint">A record of what HR and employees did (leave requests, check-ins, approvals, payroll, changes). Only admins can see this page.</p>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {data && data.items.length === 0 && (
            <tr>
              <td colSpan="4">No activity yet.</td>
            </tr>
          )}
          {data?.items.map((a) => (
            <tr key={a._id}>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>
                {a.actorName} <small>({a.actorRole})</small>
              </td>
              <td>{a.action}</td>
              <td>{a.target}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data && (
        <div className="pager">
          <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {data.page} of {data.pages} ({data.total} entries)
          </span>
          <button className="secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
