
import "dotenv/config";
import mongoose from "mongoose";
import Software from "./src/models/Software.js";

async function seedScreener() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const product = await Software.findOneAndUpdate(
      {
        business: "TRILLION_TRADING",
        productId: "SHORT_TERM_BREAKOUT",
      },
      {
        $setOnInsert: {
          name: "Short-Term Breakout Screener Access",
          price: 999,
          description: "Short-Term Breakout Screener Access",
          features: ["Chartink Screener Access"],
          active: true,
          trialDays: 0,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log("Screener product ready:", product);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedScreener();
