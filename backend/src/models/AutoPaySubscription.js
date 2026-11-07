
import mongoose from "mongoose";

const autoPaySubscriptionSchema = new mongoose.Schema(
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
        "SOFTWARE",
        "RIGHT_SOFTWARE",
        "LEVEL_1",
        "LEVEL_2",
        "COURSE_PACKAGE",
      ],
      required: true,
      immutable: true,
    },

    customer: {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      mobile: { type: String, required: true, trim: true },
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    initialOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      immutable: true,
    },

    originalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 100,
    },

    currency: {
  type: String,
  enum: ["INR"],
  default: "INR",
},

    razorpayPlanId: {
      type: String,
      default: null,
    },

    razorpaySubscriptionId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "PENDING_AUTH",
        "ACTIVE",
        "HALTED",
        "CANCELLED",
        "COMPLETED",
        "FAILED",
      ],
      default: "PENDING_AUTH",
    },

    consentAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    consentAcceptedAt: {
      type: Date,
      default: null,
    },

    initialPaymentAt: {
      type: Date,
      required: true,
    },

    nextBillingAt: {
      type: Date,
      required: true,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    lastPaidAt: {
      type: Date,
      default: null,
    },

    lastPaymentId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

autoPaySubscriptionSchema.index(
  { business: 1, razorpaySubscriptionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpaySubscriptionId: { $type: "string" },
    },
  }
);

autoPaySubscriptionSchema.index({
  business: 1,
  status: 1,
  nextBillingAt: 1,
});

autoPaySubscriptionSchema.index({
  initialOrderId: 1,
});

export default mongoose.model(
  "AutoPaySubscription",
  autoPaySubscriptionSchema
);
