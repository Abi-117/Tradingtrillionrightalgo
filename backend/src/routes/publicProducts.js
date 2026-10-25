
import { Router } from "express";
import Course from "../models/Course.js";
import Software from "../models/Software.js";

const router = Router();

// GET /api/products/courses
router.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find({
      business: "TRILLION_TRADING",
      active: true,
    })
      .select(
        "productId name description price topics durationDays totalSessions"
      )
      .sort({ productId: 1 })
      .lean();

    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/software
router.get("/software", async (req, res, next) => {
  try {
    const software = await Software.findOne({
      business: "TRILLION_TRADING",
      productId: "SOFTWARE",
      active: true,
    })
      .select("productId name description price trialDays features")
      .lean();

    if (!software) {
      return res.status(404).json({
        success: false,
        message: "Software is currently unavailable.",
      });
    }

    res.json({
      success: true,
      software,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
