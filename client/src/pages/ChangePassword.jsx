import { useState } from "react";
import api from "../services/api.js";

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setMessage("");
    if (!form.currentPassword) return setError("Enter your current password");
    if (form.newPassword.length < 6) return setError("New password must be at least 6 characters");
    if (form.newPassword !== form.confirm) return setError("New passwords do not match");

    setSaving(true);
    try {
      await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage("Password changed");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="toolbar"><h2>Change Password</h2></div>
      <form className="card" onSubmit={handleSubmit} noValidate>
        <input type="password" placeholder="Current password" value={form.currentPassword} onChange={set("currentPassword")} />
        <input type="password" placeholder="New password (min 6)" value={form.newPassword} onChange={set("newPassword")} />
        <input type="password" placeholder="Confirm new password" value={form.confirm} onChange={set("confirm")} />
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Change password"}</button>
      </form>
    </div>
  );
}
