import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canManage = user.role === "admin" || user.role === "hr";
  const isAdmin = user.role === "admin";

  // Har link ke saath menu band (mobile par)
  const link = (to, label, props = {}) => (
    <NavLink to={to} onClick={() => setMenuOpen(false)} {...props}>
      {label}
    </NavLink>
  );

  return (
    <div className="shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">HR Portal</div>
        <nav>
          {link("/", "Dashboard", { end: true })}
          {canManage && link("/employees", "Employees")}
          {canManage && link("/departments", "Departments")}
          {canManage && link("/attendance", "Attendance")}
          {canManage && link("/leaves", "Leaves")}
          {canManage && link("/payroll", "Payroll")}
          {canManage && link("/reports", "Reports")}
          {!canManage && link("/my/profile", "My Profile")}
          {!canManage && link("/my/attendance", "My Attendance")}
          {!canManage && link("/my/leaves", "My Leaves")}
          {!canManage && link("/my/payslips", "My Payslips")}
          {!canManage && link("/my/documents", "My Documents")}
          {link("/holidays", "Holidays")}
          {isAdmin && link("/activity", "Activity log")}
          {link("/password", "Password")}
        </nav>
      </aside>
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="appbar">
          <button className="menu-btn secondary" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
            Menu
          </button>
          <span className="appbar-spacer" />
          <NotificationBell />
          <span className="appbar-user">
            {user.name} <small>({user.role})</small>
          </span>
          <button onClick={handleLogout}>Logout</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
