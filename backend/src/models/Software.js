
import mongoose from "mongoose";

const softwareSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      enum: ["SOFTWARE", "RIGHT_SOFTWARE", "SHORT_TERM_BREAKOUT"],
      required: true,
    },

    business: {
      type: String,
      enum: ["TRILLION_TRADING", "RIGHT_ALGO_TRADING"],
      required: true,
      default: "TRILLION_TRADING",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
      default: 9999,
    },

    trialDays: {
      type: Number,
      default: 3,
      min: 0,
      max: 3,
    },

    description: {
      type: String,
      default: "",
    },

    features: [{ type: String }],

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

// Each business can have its own software product.
softwareSchema.index(
  { business: 1, productId: 1 },
  { unique: true },
);

export default mongoose.model("Software", softwareSchema);
