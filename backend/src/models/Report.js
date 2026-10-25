
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: ["TRILLION_TRADING", "RIGHT_ALGO_TRADING"],
      default: "TRILLION_TRADING",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    downloadUrl: {
      type: String,
      default: null,
    },
    published: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true, strict: "throw" }
);

reportSchema.index({ published: 1, category: 1, reportDate: -1 });

export default mongoose.model("Report", reportSchema);
