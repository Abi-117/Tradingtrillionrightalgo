
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export async function requireStudent(req, res, next) {
  try {
    const token = req.cookies?.student_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Student login required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");
      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "trillion-trading-api",
      audience: "trillion-trading-student",
    });

    if (!payload.sub || payload.role !== "STUDENT") {
      return res.status(401).json({
        success: false,
        message: "Invalid student session.",
      });
    }

    const student = await Student.findById(payload.sub);

    if (!student || !student.isActive) {
      res.clearCookie("student_session", cookieOptions);

      return res.status(401).json({
        success: false,
        message: "Student account is inactive or unavailable.",
      });
    }

    req.student = student;
    return next();
  } catch (error) {
    const { maxAge, ...clearOptions } = {
      ...cookieOptions,
      maxAge: undefined,
    };

    res.clearCookie("student_session", clearOptions);

    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Student session expired or invalid. Please log in again.",
      });
    }

    console.error("Student authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify student session.",
    });
  }
}
