import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  department: "",
  designation: "",
  joiningDate: "",
  salary: "",
  status: "active",
};

const EMAIL_RX = /^\S+@\S+\.\S+$/;
const PHONE_RX = /^[0-9+\-\s()]{7,15}$/;

// Form bhejne se pehle har field check hota hai. Khali object = sab theek.
const validate = (f) => {
  const errors = {};
  if (f.firstName.trim().length < 2) errors.firstName = "First name must be at least 2 characters";
  if (f.lastName.trim().length < 2) errors.lastName = "Last name must be at least 2 characters";
  if (!EMAIL_RX.test(f.email.trim())) errors.email = "Enter a valid email address";
  if (f.phone.trim() && !PHONE_RX.test(f.phone.trim()))
    errors.phone = "Phone must be 7-15 characters (digits, +, -, spaces)";
  if (f.salary !== "" && (Number.isNaN(Number(f.salary)) || Number(f.salary) < 0))
    errors.salary = "Salary must be 0 or more";
  return errors;
};

// Empty fields server ko nahi bhejte, text trim hota hai, salary number banti hai.
const toPayload = (form) => {
  const data = {};
  Object.entries(form).forEach(([key, value]) => {
    const v = typeof value === "string" ? value.trim() : value;
    if (v !== "") data[key] = v;
  });
  if (data.salary !== undefined) data.salary = Number(data.salary);
  return data;
};

function Field({ label, error, children }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      {children}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const errorText = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const loadEmployees = async (text = "") => {
    try {
      const { data } = await api.get("/employees", { params: { search: text } });
      setEmployees(data);
    } catch (err) {
      setError(errorText(err, "Failed to load employees"));
    }
  };

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (err) {
      setError(errorText(err, "Failed to load departments"));
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Search karte waqt thora ruk kar list refresh hoti hai
  useEffect(() => {
    const timer = setTimeout(() => loadEmployees(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: undefined });
  };

  const openAdd = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setEditingId(null);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const openEdit = (emp) => {
    setForm({
      employeeId: emp.employeeId || "",
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      email: emp.email || "",
      phone: emp.phone || "",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : "",
      gender: emp.gender || "",
      address: emp.address || "",
      department: emp.department?._id || "",
      designation: emp.designation || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
      salary: emp.salary ?? "",
      status: emp.status || "active",
    });
    setFieldErrors({});
    setEditingId(emp._id);
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/employees/${editingId}`, toPayload(form));
        setMessage("Employee updated");
      } else {
        await api.post("/employees", toPayload(form));
        setMessage("Employee added");
      }
      closeForm();
      loadEmployees(search);
    } catch (err) {
      // Server ka message (jaise "email already exists") yahan dikhta hai
      setError(errorText(err, "Could not save employee"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete ${emp.firstName} ${emp.lastName}?`)) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/employees/${emp._id}`);
      setMessage("Employee deleted");
      loadEmployees(search);
    } catch (err) {
      setError(errorText(err, "Could not delete employee"));
    }
  };

  const handleAddDepartment = async () => {
    if (!newDept.trim()) return;
    setError("");
    try {
      const { data } = await api.post("/departments", { name: newDept.trim() });
      setNewDept("");
      await loadDepartments();
      setForm((f) => ({ ...f, department: data._id }));
    } catch (err) {
      setError(errorText(err, "Could not add department"));
    }
  };

  const cls = (name) => (fieldErrors[name] ? "invalid" : "");

  return (
    <div>
      <div className="toolbar">
        <h2>Employees</h2>
        <input
          className="search"
          placeholder="Search name, email, ID, designation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={openAdd}>+ Add Employee</button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit} noValidate>
          <h3>{editingId ? "Edit Employee" : "Add Employee"}</h3>
          <div className="form-grid">
            <Field error={fieldErrors.employeeId}>
              <input
                name="employeeId"
                placeholder="Employee ID (blank = auto)"
                value={form.employeeId}
                onChange={handleChange}
              />
            </Field>
            <Field error={fieldErrors.firstName}>
              <input
                name="firstName"
                className={cls("firstName")}
                placeholder="First name *"
                value={form.firstName}
                onChange={handleChange}
              />
            </Field>
            <Field error={fieldErrors.lastName}>
              <input
                name="lastName"
                className={cls("lastName")}
                placeholder="Last name *"
                value={form.lastName}
                onChange={handleChange}
              />
            </Field>
            <Field error={fieldErrors.email}>
              <input
                name="email"
                type="email"
                className={cls("email")}
                placeholder="Email *"
                value={form.email}
                onChange={handleChange}
              />
            </Field>
            <Field error={fieldErrors.phone}>
              <input
                name="phone"
                className={cls("phone")}
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
              />
            </Field>
            <Field label="Date of birth">
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                title="Date of birth"
              />
            </Field>
            <Field>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">-- Gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field>
              <input
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <input
                name="designation"
                placeholder="Designation"
                value={form.designation}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <select name="department" value={form.department} onChange={handleChange}>
                <option value="">-- Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Joining date">
              <input
                name="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={handleChange}
                title="Joining date"
              />
            </Field>
            <Field error={fieldErrors.salary}>
              <input
                name="salary"
                type="number"
                min="0"
                className={cls("salary")}
                placeholder="Salary"
                value={form.salary}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <div className="dept-add">
            <input
              placeholder="New department name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
            <button type="button" className="secondary" onClick={handleAddDepartment}>
              Add Department
            </button>
          </div>

          <div className="actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
            <button type="button" className="secondary" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td colSpan="7">No employees found.</td>
            </tr>
          )}
          {employees.map((emp) => (
            <tr key={emp._id}>
              <td>{emp.employeeId}</td>
              <td>
                {emp.firstName} {emp.lastName}
              </td>
              <td>{emp.email}</td>
              <td>{emp.department?.name || "-"}</td>
              <td>{emp.designation || "-"}</td>
              <td>{emp.status}</td>
              <td className="row-actions">
                <Link className="btn-link" to={`/employees/${emp._id}`}>
                  View
                </Link>
                <button className="secondary" onClick={() => openEdit(emp)}>
                  Edit
                </button>
                {user.role === "admin" && (
                  <button className="danger" onClick={() => handleDelete(emp)}>
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
