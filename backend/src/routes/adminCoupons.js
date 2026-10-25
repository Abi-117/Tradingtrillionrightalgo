
import { Router } from "express";
import { z } from "zod";
import Coupon from "../models/Coupon.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(requireAdmin);

const allowedProducts = [
  "LEVEL_1",
  "LEVEL_2",
  "COURSE_PACKAGE",
  "SOFTWARE",
];

const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(40)
    .regex(/^[A-Za-z0-9_-]+$/),
  products: z.array(z.enum([
    "LEVEL_1",
    "LEVEL_2",
    "COURSE_PACKAGE",
    "SOFTWARE",
  ])).min(1),
  discountAmount: z.number().int().min(1).max(10000000),
  maxUses: z.number().int().min(0).default(0),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
}).strict().refine(
  (data) => !data.expiresAt ||
    !data.startsAt ||
    data.expiresAt > data.startsAt,
  { message: "Expiry must be later than the start date." }
);

// GET /api/admin/coupons
router.get("/", async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      business: "TRILLION_TRADING",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/coupons
router.post("/", async (req, res, next) => {
  try {
    const parsed = createCouponSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon details.",
        errors: parsed.error.issues,
      });
    }

    const data = parsed.data;
    const code = data.code.toUpperCase();

    // Prevent a discount larger than the cheapest eligible product.
    const Course = (await import("../models/Course.js")).default;
    const Software = (await import("../models/Software.js")).default;

    const prices = [];

    for (const productId of data.products) {
      const product = productId === "SOFTWARE"
        ? await Software.findOne({
            productId,
            business: "TRILLION_TRADING",
            active: true,
          })
        : await Course.findOne({
            productId,
            business: "TRILLION_TRADING",
            active: true,
          });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Eligible active product not found: ${productId}`,
        });
      }

      prices.push(product.price);
    }

    if (data.discountAmount >= Math.min(...prices)) {
      return res.status(400).json({
        success: false,
        message: "Discount must be less than every eligible product price.",
      });
    }

    const coupon = await Coupon.create({
      ...data,
      code,
      business: "TRILLION_TRADING",
      discountType: "FIXED",
      startsAt: data.startsAt || new Date(),
      expiresAt: data.expiresAt ?? null,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This coupon code already exists.",
      });
    }

    next(error);
  }
});

// PATCH /api/admin/coupons/:id
router.patch("/:id", async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID.",
      });
    }

    const schema = z.object({
      active: z.boolean().optional(),
      expiresAt: z.coerce.date().nullable().optional(),
      maxUses: z.number().int().min(0).optional(),
    }).strict();

    const parsed = schema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Only active, expiry and usage limit can be updated.",
      });
    }

    const coupon = await Coupon.findOneAndUpdate(
      {
        _id: req.params.id,
        business: "TRILLION_TRADING",
      },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
});

export default router;
