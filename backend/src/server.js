
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import adminAuthRoutes from "./routes/adminAuth.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import adminDashboardRoutes from "./routes/adminDashboard.js";
import adminProductsRoutes from "./routes/adminProducts.js";
import adminCouponsRoutes from "./routes/adminCoupons.js";
import publicCouponsRoutes from "./routes/publicCoupons.js";
import trillionPaymentRoutes from "./routes/trillionPayments.js";
import trillionWebhookRoutes from "./routes/trillionWebhook.js";
import adminReportsRoutes from "./routes/adminReports.js";
import publicReportsRoutes from "./routes/publicReports.js";
import publicProductsRoutes from "./routes/publicProducts.js";
import rightAlgoPaymentRoutes from "./routes/rightAlgoPayments.js";
import adminRightAlgoRoutes from "./routes/adminRightAlgo.js";
import adminRightAlgoCouponsRoutes from "./routes/adminRightAlgoCoupons.js";
import adminRightAlgoReportsRoutes from "./routes/adminRightAlgoReports.js";
import publicRightAlgoReportsRoutes from "./routes/publicRightAlgoReports.js";
import studentAuthRoutes from "./routes/studentAuth.js";
import rmAuthRoutes from "./routes/rmAuth.js";
import rmAdminRoutes from "./routes/rmAdmin.js";
import rmPortalRoutes from "./routes/rmPortal.js";
import studentDashboardRoutes from "./routes/studentDashboard.js";
import rightAlgoCouponValidationRoutes
  from "./routes/rightAlgoCouponValidation.js";


const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in backend/.env");
}

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is missing in backend/.env");
}

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);
app.use(cookieParser());

app.use("/api/admin", (req, res, next) => {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");

  if (!origin || origin !== process.env.FRONTEND_URL) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
  }

  next();
});

app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/coupons", adminCouponsRoutes); 
app.use("/api/products", publicProductsRoutes);
app.use("/api/coupons", publicCouponsRoutes);
app.use("/api/trillion/payments", trillionPaymentRoutes);
app.use("/api/trillion/webhook", trillionWebhookRoutes);
app.use("/api/admin/reports", adminReportsRoutes);
app.use("/api/reports", publicReportsRoutes);
app.use("/api/right-algo", rightAlgoPaymentRoutes);
app.use("/api/admin/right-algo", adminRightAlgoRoutes);
app.use("/api/admin/right-algo/reports", adminRightAlgoReportsRoutes);
app.use("/api/admin/right-algo/coupons", adminRightAlgoCouponsRoutes);
app.use("/api/right-algo/reports", publicRightAlgoReportsRoutes);
app.use("/api/student/dashboard", studentDashboardRoutes);
app.use(
  "/api/right-algo/coupons",
  rightAlgoCouponValidationRoutes
);
app.use("/api/student/auth", studentAuthRoutes);
app.use(cookieParser());

// Keep your existing routes.
app.use("/api/rm/auth", rmAuthRoutes);
app.use("/api/admin/rm", rmAdminRoutes);
app.use("/api/rm", rmPortalRoutes);

// Local development upload serving.
// Production-ல் private/cloud object storage பயன்படுத்துவது சிறந்தது.
app.use("/uploads/rm-brokerage", express.static("uploads/rm-brokerage"));

app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard API is protected.",
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      role: req.admin.role,
    },
  });
});


app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Trading website backend is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
