
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import Admin from "../models/Admin.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 2 * 60 * 60 * 1000,
};

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and password.",
      });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const admin = await Admin.findOne({ email })
      .select("+passwordHash");

    if (
      !admin ||
      !admin.isActive ||
      !(await bcrypt.compare(
        parsed.data.password,
        admin.passwordHash
      ))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        subject: admin._id.toString(),
        expiresIn: "2h",
        algorithm: "HS256",
        issuer: "trillion-trading-api",
        audience: "trillion-trading-admin",
      }
    );

    admin.lastLoginAt = new Date();
    await admin.save();

    res.cookie("admin_session", token, cookieOptions);

    return res.json({
      success: true,
      message: "Admin login successful.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

router.post("/logout", requireAdmin, (req, res) => {
  res.clearCookie("admin_session", {
    ...cookieOptions,
    maxAge: undefined,
  });

  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

export default router;
