
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import RMUser from "../models/RMUser.js";
import { requireRM } from "../middleware/requireRM.js";

const router = Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 8 * 60 * 60 * 1000,
};

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password || password.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Enter your email and password.",
      });
    }

    const rm = await RMUser.findOne({ email }).select("+passwordHash");

    if (!rm || !rm.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const valid = await bcrypt.compare(password, rm.passwordHash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.RM_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "RM authentication is not configured.",
      });
    }

    const token = jwt.sign(
      { role: "RM" },
      process.env.RM_JWT_SECRET,
      {
        subject: String(rm._id),
        expiresIn: "8h",
        issuer: "rm-brokerage-api",
        audience: "rm-brokerage-portal",
      }
    );

    res.cookie("rm_session", token, cookieOptions);

    return res.json({
      success: true,
      rm: {
        id: String(rm._id),
        name: rm.name,
        email: rm.email,
      },
    });
  } catch (error) {
    console.error("RM login error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

router.get("/me", requireRM, (req, res) => {
  res.json({
    success: true,
    rm: {
      id: String(req.rm._id),
      name: req.rm.name,
      email: req.rm.email,
      mobile: req.rm.mobile,
    },
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("rm_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.json({ success: true });
});

export default router;
