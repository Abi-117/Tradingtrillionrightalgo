
import { Router } from "express";
import Report from "../models/Report.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const reports = await Report.find({
      category: "RIGHT_ALGO_TRADING",
      published: true,
    })
      .select("title description reportDate imageUrl downloadUrl")
      .sort({ reportDate: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
