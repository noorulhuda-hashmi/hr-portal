import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { name: "", description: "" };

export default function Departments() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const load = async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (err) {
      setError(errorText(err, "Failed to load departments"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const name = form.name.trim();
    if (name.length < 2) {
      setError("Department name must be at least 2 characters");
      return;
    }

    const payload = { name, description: form.description.trim() };
    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
        setMessage("Department updated");
      } else {
        await api.post("/departments", payload);
        setMessage("Department added");
      }
      reset();
      load();
    } catch (err) {
      setError(errorText(err, "Could not save department"));
    }
  };

  const startEdit = (d) => {
    setEditingId(d._id);
    setForm({ name: d.name, description: d.description || "" });
    setError("");
    setMessage("");
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/departments/${d._id}`);
      setMessage("Department deleted");
      load();
    } catch (err) {
      setError(errorText(err, "Could not delete department"));
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h2>Departments</h2>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>{editingId ? "Edit Department" : "Add Department"}</h3>
        <div className="form-grid">
          <input
            placeholder="Department name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="actions">
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Employees</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.length === 0 && (
            <tr>
              <td colSpan="4">No departments yet.</td>
            </tr>
          )}
          {departments.map((d) => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td>{d.description || "-"}</td>
              <td>{d.employeeCount}</td>
              <td className="row-actions">
                <button className="secondary" onClick={() => startEdit(d)}>
                  Edit
                </button>
                {user.role === "admin" && (
                  <button className="danger" onClick={() => handleDelete(d)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
