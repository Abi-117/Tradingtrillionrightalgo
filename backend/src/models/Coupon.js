
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    business: {
      type: String,
      enum: ["TRILLION_TRADING", "RIGHT_ALGO_TRADING"],
      required: true,
    },
    products: [
      {
        type: String,
        enum: [
          "LEVEL_1",
          "LEVEL_2",
          "COURSE_PACKAGE",
          "SOFTWARE",
          "REGISTRATION",
          "RIGHT_SOFTWARE",
        ],
      },
    ],
    discountType: {
      type: String,
      enum: ["FIXED"],
      default: "FIXED",
    },
    discountAmount: { type: Number, required: true, min: 1 },
    maxUses: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, strict: "throw" }
);

couponSchema.index({ business: 1, code: 1 }, { unique: true });

export default mongoose.model("Coupon", couponSchema);
