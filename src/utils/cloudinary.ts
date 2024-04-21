import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { config } from "dotenv";

config({ path: "./.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const uploadOnCloundinary = async (localFilePath: any) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "ecommerce/product-images",
      resource_type: "auto",
    });

    // file has been uploaded successfully
    console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("file upload on cloudinary error : ", error);
    return null;
  }
};

const deleteFromCloudinary = async (publicId: string) => {
  try {
    // delete the file from cloudinary
    const response = await cloudinary.uploader.destroy(publicId);
    console.log("file is deleted from cloudinary ", response.result);
    return response;
  } catch (error) {
    console.log("file delete from cloudinary error : ", error);
    return null;
  }
}

export { uploadOnCloundinary , deleteFromCloudinary};