
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin login required",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "trillion-trading-api",
      audience: "trillion-trading-admin",
    });

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin session",
      });
    }

    const admin = await Admin.findById(payload.sub)
      .select("name email role isActive");

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    req.admin = admin;
    next();
  } catch {
    res.clearCookie("admin_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please log in again.",
    });
  }
}

export function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Super admin permission required",
    });
  }

  next();
}
