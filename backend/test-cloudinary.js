
import "dotenv/config";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (
  !CLOUDINARY_CLOUD_NAME ||
  !CLOUDINARY_API_KEY ||
  !CLOUDINARY_API_SECRET
) {
  throw new Error("Cloudinary environment variables are missing");
}

const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>',
).toString("base64");

const body = new URLSearchParams({
  file: `data:image/svg+xml;base64,${svg}`,
  public_id: `upload-debug-${Date.now()}`,
  folder: "trillion-trading/daily-reports",
});

const credentials = Buffer.from(
  `${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`,
).toString("base64");

try {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  console.log("HTTP STATUS:", response.status);
  console.log("X-Cld-Error:", response.headers.get("X-Cld-Error"));
  console.log("RESPONSE BODY:", await response.text());
} catch (error) {
  console.error("REQUEST ERROR:", error.message);
}
