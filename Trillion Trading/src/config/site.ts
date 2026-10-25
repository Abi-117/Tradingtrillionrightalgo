export const site = {
  apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] ?? "",
  course: {
    level1: 14999,
    level2: 19999,
    package: 35000,
    days: 30,
    sessions: 30,
    coupons: [
      { code: "", discount: 5000 },
      { code: "", discount: 2000 },
    ],
  },
  software: { price: 9999, discount: 5000, couponCode: "", trialDays: 3 },
  right: {
    registrationFee: 2000,
    phone: "9003022718",
    supportPhone: "919003022718",
    supportEmail: "",
    advertisedAccuracy: "75%–80%",
    whatsapp: "https://wa.me/919003022718",
  },
  trillion: {
    phone: "9025610751",
    email: "trilliontrading01@gmail.com",
    whatsapp: "https://wa.me/919025610751",
    courseGroup: "https://chat.whatsapp.com/L4ehj6mCbbWJ4lp4F1si9U",
    instagram: "https://instagram.com/trilliontrading01?xtok=MXhjNHcyemVxa2pyeQ%3D%3D",
    softwareInstagram: "https://instagram.com/trillion_algo_software?cplk=MTExa2VqNWVweXphZQ%3D%3D",
  },
  rightSoftware: {
    name: "RIGHT ALGO TRADING",
    price: 9999,
    // Redemption code and discount are configured and validated by the backend only.
    couponCode: "",
    discount: 0,
  },
  rightInstagram: "https://instagram.com/rightalgo0?cplk=MTVveHZhMmc4NHdsZw%3D%3D",
  rightGroup: "https://chat.whatsapp.com/Gow1TUSKW8K37rsHQHMAWa",
};
export const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
export const level1Topics = [
  "Basic Candlestick Patterns",
  "Basic Support & Resistance",
  "SMA, EMA, RSI, MACD Basics",
  "Basic Chart Patterns",
  "Basic Breakout Setup",
  "Stop-Loss, Risk-to-Reward",
  "Basic Trend Analysis",
];
export const level2Topics = [
  "Detailed Candlestick Combinations",
  "Advanced Supply & Demand",
  "Indicator Confluence Systems",
  "Complex Pattern Trading",
  "Advanced Price Action Systems",
  "Advanced Position Sizing & Trade Management",
  "Multi-Timeframe Advanced Analysis",
];
export const softwareFeatures = [
  { title: "Smart Algorithms", description: "Advanced | Optimized | Reliable" },
  {
    title: "Accurate Signals",
    description: "High Accuracy | Better Timing — performance varies; not guaranteed.",
  },
  {
    title: "Auto Execution",
    description: "Fast | Secure | Hassle Free, where broker integration is supported.",
  },
  { title: "User Friendly", description: "Simple Interface | Easy to Use" },
  {
    title: "Real-Time Market Trends",
    description: "Stay informed about changing market conditions.",
  },
  {
    title: "Competitor Analysis",
    description: "Supplied feature claim; applicability subject to business confirmation.",
  },
  {
    title: "Customer Insights",
    description: "Supplied feature claim; applicability subject to business confirmation.",
  },
  {
    title: "Growth Opportunities",
    description: "Explore potential opportunities, without assured outcomes.",
  },
  {
    title: "Data-Driven Decisions",
    description: "Bring market information into a structured decision process.",
  },
];
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Trillion Trading` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Trillion Trading` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
