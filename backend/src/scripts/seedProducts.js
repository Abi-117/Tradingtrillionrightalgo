
import "dotenv/config";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Software from "../models/Software.js";

const courses = [
  {
    productId: "LEVEL_1",
    name: "Trillion Trading - Level 1",
    price: 14999,
    durationDays: 30,
    totalSessions: 30,
    topics: [
      "Basic Candlestick Patterns",
      "Basic Support & Resistance",
      "SMA, EMA, RSI, MACD Basics",
      "Basic Chart Patterns",
      "Basic Breakout Setup",
      "Stop-Loss, Risk-to-Reward",
      "Basic Trend Analysis",
    ],
  },
  {
    productId: "LEVEL_2",
    name: "Trillion Trading - Level 2",
    price: 19999,
    durationDays: 30,
    totalSessions: 30,
    topics: [
      "Detailed Candlestick Combinations",
      "Advanced Supply & Demand",
      "Indicator Confluence Systems",
      "Complex Pattern Trading",
      "Advanced Price Action Systems",
      "Advanced Position Sizing & Trade Management",
      "Multi-Timeframe Advanced Analysis",
    ],
  },
  {
    productId: "COURSE_PACKAGE",
    name: "Trillion Trading - Complete Course",
    price: 35000,
    durationDays: 30,
    totalSessions: 30,
    topics: [
      "Complete Level 1 and Level 2 syllabus",
      "Multi-Timeframe Analysis",
    ],
  },
];

async function seedProducts() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    for (const course of courses) {
      await Course.updateOne(
        {
          business: "TRILLION_TRADING",
          productId: course.productId,
        },
        {
          $setOnInsert: {
            ...course,
            business: "TRILLION_TRADING",
            active: true,
          },
        },
        { upsert: true }
      );
    }

    await Software.updateOne(
      {
        business: "TRILLION_TRADING",
        productId: "SOFTWARE",
      },
      {
        $setOnInsert: {
          productId: "SOFTWARE",
          business: "TRILLION_TRADING",
          name: "BUY and SELL Software",
          price: 9999,
          trialDays: 3,
          active: true,
          features: [
            "Smart Algorithms",
            "Accurate Signals",
            "Auto Execution",
            "User Friendly",
            "Risk Management",
          ],
        },
      },
      { upsert: true }
    );

    console.log("Default Trillion Trading products are ready.");
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts().catch((error) => {
  console.error("Product seeding failed:", error.message);
  process.exitCode = 1;
});
