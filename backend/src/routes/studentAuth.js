
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import Student from "../models/Student.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  mobile: z.string().trim().regex(/^\+?[0-9\s()-]{10,15}$/),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1).max(128),
});

function createStudentToken(student) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }

  return jwt.sign(
    { role: "STUDENT" },
    process.env.JWT_SECRET,
    {
      subject: String(student._id),
      expiresIn: "7d",
      algorithm: "HS256",
      issuer: "trillion-trading-api",
      audience: "trillion-trading-student",
    }
  );
}

function studentResponse(student) {
  return {
    id: String(student._id),
    name: student.name,
    email: student.email,
    mobile: student.mobile,
  };
}

// Register
router.post("/register", loginLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid name, email, mobile number and password (minimum 8 characters).",
      });
    }

    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase().trim();
    const mobile = parsed.data.mobile.trim();

    const existing = await Student.findOne({ email }).select("_id");

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please log in.",
      });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const student = await Student.create({
      name,
      email,
      mobile,
      passwordHash,
    });

    const token = createStudentToken(student);

    res.cookie("student_session", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      student: studentResponse(student),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please log in.",
      });
    }

    next(error);
  }
});

// Login
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

    const student = await Student.findOne({ email }).select("+passwordHash");

    if (
      !student ||
      !student.isActive ||
      !(await bcrypt.compare(
        parsed.data.password,
        student.passwordHash
      ))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createStudentToken(student);

    student.lastLoginAt = new Date();
    await student.save();

    res.cookie("student_session", token, cookieOptions);

    return res.json({
      success: true,
      message: "Student login successful.",
      student: studentResponse(student),
    });
  } catch (error) {
    next(error);
  }
});

// Current logged-in student
router.get("/me", requireStudent, (req, res) => {
  return res.json({
    success: true,
    student: studentResponse(req.student),
  });
});

// Logout
router.post("/logout", requireStudent, (req, res) => {
  const { maxAge, ...clearOptions } = cookieOptions;

  res.clearCookie("student_session", clearOptions);

  return res.json({
    success: true,
    message: "Student logged out successfully.",
  });
});

export default router;
