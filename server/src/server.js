require("dotenv").config();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const meRoutes = require("./routes/meRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const documentRoutes = require("./routes/documentRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { securityHeaders, apiLimiter, sanitize } = require("./middleware/security");

const isProduction = process.env.NODE_ENV === "production";
const app = express();

// Render jaisi hosting par proxy ke peeche asli IP sahi pehchanne ke liye
if (isProduction) app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "100kb" }));
app.use(sanitize);
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(db === "connected" ? 200 : 503).json({ status: db === "connected" ? "ok" : "degraded", db, service: "HR Portal API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/me", meRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/documents", documentRoutes);

// Production mein ek hi server React ki build bhi dikhata hai
const clientDist = path.join(__dirname, "../../client/dist");
if (isProduction && fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api(\/|$))[^.]*$/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Bina secret ke server chalana khatarnak hai: token koi bhi bana sakta hai
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error("JWT_SECRET must be set in .env and be at least 16 characters long.");
    process.exit(1);
  }
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
