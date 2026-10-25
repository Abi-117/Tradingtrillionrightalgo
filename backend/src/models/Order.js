
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    business: {
      type: String,
      enum: ["TRILLION_TRADING", "RIGHT_ALGO_TRADING"],
      required: true,
      immutable: true,
    },
    product: {
      type: String,
      enum: [
        "LEVEL_1",
        "LEVEL_2",
        "COURSE_PACKAGE",
        "SOFTWARE",
        "REGISTRATION",
        "RIGHT_SOFTWARE",
        "SHORT_TERM_BREAKOUT",
      ],
      required: true,
      immutable: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      mobile: { type: String, required: true, trim: true },
    },
    registrationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "RightAlgoRegistration",
  default: null,
  immutable: true,
},
studentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Student",
  default: null,
},
    couponCode: { type: String, default: null },
    originalAmount: { type: Number, required: true, min: 1 },
    discountAmount: { type: Number, default: 0, min: 0 },
    payableAmount: { type: Number, required: true, min: 1 },
    amountPaise: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR", immutable: true },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    verifiedAt: { type: Date, default: null },
    receiptNumber: { type: String, default: null },
  },
  { timestamps: true, strict: "throw" }
);

orderSchema.index(
  { business: 1, razorpayOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayOrderId: { $type: "string" },
    },
  }
);


orderSchema.index(
  { business: 1, razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: { $type: "string" },
    },
  }
);

orderSchema.index({ business: 1, paymentStatus: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
