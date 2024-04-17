import { v2 as cloudinary } from "cloudinary";
import { Request } from "express";
import multer from "multer";

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// Create multer middleware
export const singleUpload = multer({ storage }).single("photo");

// Middleware to upload image to Cloudinary
export const uploadToCloudinary = (req: Request, res: any, next: any) => {
  if (!req.file) return next();

  // Upload image to Cloudinary
  cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error: any, result: any) => {
    if (error) {
      console.error("Error uploading to Cloudinary:", error);
      return res.status(500).json({ error: "Error uploading image" });
    }

    if (!result) {
      console.error("Error: Upload response is empty");
      return res.status(500).json({ error: "Error uploading image" });
    }

    req.body.photoUrl = result.secure_url; // Store Cloudinary URL in request body
    next();
  }).end(req.file.buffer);
};
