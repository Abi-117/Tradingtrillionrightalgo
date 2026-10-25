
import mongoose from "mongoose";

const rmWeeklyReportSchema = new mongoose.Schema(
  {
    rmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMUser",
      required: true,
      index: true,
    },
    year: { type: Number, required: true, min: 2020, max: 2100 },
    month: { type: Number, required: true, min: 1, max: 12 },
    week: { type: Number, required: true, min: 1, max: 5 },

    brokerageReceived: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rmSharingAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    screenshotUrl: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true, strict: "throw" }
);

rmWeeklyReportSchema.index(
  { rmId: 1, year: 1, month: 1, week: 1 },
  { unique: true }
);

export default mongoose.model("RMWeeklyReport", rmWeeklyReportSchema);
