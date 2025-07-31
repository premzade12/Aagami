import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config(); 

// console.log("🌐 CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "❌ MISSING");
// console.log("🔑 CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY || "❌ MISSING");
// console.log("🔐 CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ PRESENT" : "❌ MISSING");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath, resourceType = "auto") => {
  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "video", // "image", "video", or "auto"
    });
    fs.unlinkSync(filePath); // remove local temp file
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // remove even if error
    throw new Error("Cloudinary upload failed");
  }
};

export default uploadOnCloudinary;
