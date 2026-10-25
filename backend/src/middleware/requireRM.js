
import jwt from "jsonwebtoken";
import RMUser from "../models/RMUser.js";

export async function requireRM(req, res, next) {
  try {
    const token = req.cookies?.rm_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in to your RM account.",
      });
    }

    if (!process.env.RM_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "RM authentication is not configured.",
      });
    }

    const payload = jwt.verify(token, process.env.RM_JWT_SECRET, {
      issuer: "rm-brokerage-api",
      audience: "rm-brokerage-portal",
    });

    if (payload.role !== "RM" || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid RM session.",
      });
    }

    const rm = await RMUser.findOne({
      _id: payload.sub,
      isActive: true,
    }).select("_id name email mobile");

    if (!rm) {
      return res.status(401).json({
        success: false,
        message: "RM account is inactive or unavailable.",
      });
    }

    req.rm = rm;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your RM session has expired. Please log in again.",
    });
  }
}
