
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
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

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "trillion-trading-api",
      audience: "trillion-trading-student",
    });

    if (!payload.sub) {
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
    next();
  } catch (error) {
    res.clearCookie("student_session", cookieOptions);

    return res.status(401).json({
      success: false,
      message: "Student session expired. Please log in again.",
    });
  }
}
