
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      enum: ["LEVEL_1", "LEVEL_2", "COURSE_PACKAGE"],
      required: true,
      unique: true,
    },
    business: {
      type: String,
      enum: ["TRILLION_TRADING"],
      default: "TRILLION_TRADING",
      immutable: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 1 },
    topics: [{ type: String, trim: true }],
    durationDays: { type: Number, default: 30, min: 1 },
    totalSessions: { type: Number, default: 30, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, strict: "throw" }
);

export default mongoose.model("Course", courseSchema);
