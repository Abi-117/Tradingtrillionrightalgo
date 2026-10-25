
import { Router } from "express";
import { z } from "zod";
import Course from "../models/Course.js";
import Software from "../models/Software.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(requireAdmin);

const courseIds = ["LEVEL_1", "LEVEL_2", "COURSE_PACKAGE"];

const courseUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().max(3000).optional(),
  price: z.number().int().min(1).max(10000000).optional(),
  topics: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  totalSessions: z.number().int().min(1).max(500).optional(),
  active: z.boolean().optional(),
}).strict();

const softwareUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().max(3000).optional(),
  price: z.number().int().min(1).max(10000000).optional(),
  trialDays: z.number().int().min(0).max(3).optional(),
  features: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  active: z.boolean().optional(),
}).strict();

// GET /api/admin/products
router.get("/", async (req, res, next) => {
  try {
    const [courses, software] = await Promise.all([
      Course.find({ business: "TRILLION_TRADING" })
        .sort({ productId: 1 })
        .lean(),
      Software.find({ business: "TRILLION_TRADING" }).lean(),
    ]);

    res.json({
      success: true,
      products: { courses, software },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/products/courses/:productId
router.patch("/courses/:productId", async (req, res, next) => {
  try {
    if (!courseIds.includes(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course product ID.",
      });
    }

    const parsed = courseUpdateSchema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty course update.",
        errors: parsed.success ? undefined : parsed.error.issues,
      });
    }

    const course = await Course.findOneAndUpdate(
      {
        productId: req.params.productId,
        business: "TRILLION_TRADING",
      },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found. Seed the default products first.",
      });
    }

    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/products/software/SOFTWARE
router.patch("/software/:productId", async (req, res, next) => {
  try {
    if (
  !["SOFTWARE", "SHORT_TERM_BREAKOUT"].includes(
    req.params.productId
  )
) {
  return res.status(400).json({
    success: false,
    message: "Invalid software product ID.",
  });
    }

    const parsed = softwareUpdateSchema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty software update.",
        errors: parsed.success ? undefined : parsed.error.issues,
      });
    }

await Software.findOneAndUpdate(
  {
    business: "TRILLION_TRADING",
    productId: "SHORT_TERM_BREAKOUT",
  },
  {
    $setOnInsert: {
      name: "Short-Term Breakout Screener Access",
      price: 999,
      description:
        "Access to the Short-Term Breakout stock screener.",
      features: [
        "Short-Term Breakout screener access",
        "External Chartink screener link",
      ],
      active: true,
      trialDays: 0,
    },
  },
  {
    upsert: true,
    new: true,
    runValidators: true,
  }
);

    if (!software) {
      return res.status(404).json({
        success: false,
        message: "Software not found. Seed the default products first.",
      });
    }

    res.json({ success: true, software });
  } catch (error) {
    next(error);
  }
});

export default router;
