
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import Coupon from "../models/Coupon.js";
import Software from "../models/Software.js";

const router = Router();

const couponLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const schema = z.object({
  code: z.string().trim().min(3).max(40)
    .regex(/^[A-Za-z0-9_-]+$/),
  productId: z.literal("RIGHT_SOFTWARE"),
}).strict();

router.post("/validate", couponLimiter, async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Right Algo software coupon.",
      });
    }

    const code = parsed.data.code.toUpperCase();
    const now = new Date();

    const product = await Software.findOne({
      productId: "RIGHT_SOFTWARE",
      business: "RIGHT_ALGO_TRADING",
      active: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Right Algo software is unavailable.",
      });
    }

    const coupon = await Coupon.findOne({
      code,
      business: "RIGHT_ALGO_TRADING",
      active: true,
      products: "RIGHT_SOFTWARE",
      startsAt: { $lte: now },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    }).lean();

    if (
      !coupon ||
      (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired, or unavailable coupon.",
      });
    }

    const originalAmount = product.price;
    const discountAmount = coupon.discountAmount;

    if (
      !Number.isSafeInteger(originalAmount) ||
      !Number.isSafeInteger(discountAmount) ||
      discountAmount <= 0 ||
      discountAmount >= originalAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon cannot be applied to this product.",
      });
    }

    return res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountAmount,
      },
      product: {
        productId: product.productId,
        name: product.name,
      },
      pricing: {
        currency: "INR",
        originalAmount,
        discountAmount,
        payableAmount: originalAmount - discountAmount,
      },
      message: "Coupon applied successfully.",
    });
  } catch (error) {
    console.error("RIGHT_ALGO_COUPON_VALIDATION_ERROR:", error);
    next(error);
  }
});

export default router;
