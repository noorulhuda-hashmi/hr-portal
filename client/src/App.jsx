import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import EmployeeProfile from "./pages/EmployeeProfile.jsx";
import Departments from "./pages/Departments.jsx";
import Attendance from "./pages/Attendance.jsx";
import Leaves from "./pages/Leaves.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import MyDashboard from "./pages/MyDashboard.jsx";
import MyAttendance from "./pages/MyAttendance.jsx";
import MyLeaves from "./pages/MyLeaves.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Holidays from "./pages/Holidays.jsx";
import Payroll from "./pages/Payroll.jsx";
import PayslipView from "./pages/PayslipView.jsx";
import MyPayslips from "./pages/MyPayslips.jsx";
import Reports from "./pages/Reports.jsx";
import Activity from "./pages/Activity.jsx";
import MyDocuments from "./pages/MyDocuments.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

const employeeOnly = (page) => <ProtectedRoute roles={["employee"]}>{page}</ProtectedRoute>;

// Home: employee ko apni profile, admin/HR ko dashboard
function Home() {
  const { user } = useAuth();
  return user.role === "employee" ? <MyDashboard /> : <Dashboard />;
}

const hrOnly = (page) => <ProtectedRoute roles={["admin", "hr"]}>{page}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/employees" element={hrOnly(<Employees />)} />
        <Route path="/employees/:id" element={hrOnly(<EmployeeProfile />)} />
        <Route path="/departments" element={hrOnly(<Departments />)} />
        <Route path="/attendance" element={hrOnly(<Attendance />)} />
        <Route path="/leaves" element={hrOnly(<Leaves />)} />
        <Route path="/my/profile" element={employeeOnly(<MyProfile />)} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/payroll" element={hrOnly(<Payroll />)} />
        <Route
          path="/payroll/:id"
          element={hrOnly(<PayslipView base="/payroll" back="/payroll" backLabel="Back to payroll" />)}
        />
        <Route path="/reports" element={hrOnly(<Reports />)} />
        <Route path="/activity" element={<ProtectedRoute roles={["admin"]}><Activity /></ProtectedRoute>} />
        <Route path="/my/documents" element={employeeOnly(<MyDocuments />)} />
        <Route path="/my/payslips" element={employeeOnly(<MyPayslips />)} />
        <Route
          path="/my/payslips/:id"
          element={employeeOnly(<PayslipView base="/me/payslips" back="/my/payslips" backLabel="Back to my payslips" />)}
        />
        <Route path="/my/attendance" element={employeeOnly(<MyAttendance />)} />
        <Route path="/my/leaves" element={employeeOnly(<MyLeaves />)} />
        <Route path="/password" element={<ChangePassword />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
