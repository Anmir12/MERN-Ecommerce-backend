import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  singleUpload,
  uploadToCloudinary,
} from "../middlewares/multer.js";
import {
  adminProducts,
  deleteProduct,
  getallCategories,
  getallProducts,
  getlatestProducts,
  newProduct,
  singelProduct,
  updateProducts,
} from "../controllers/products.js";

const router = express.Router();

// Routes using Cloudinary middleware
router.post("/new", adminOnly, singleUpload, uploadToCloudinary, newProduct);
router.put("/:id", adminOnly, singleUpload, uploadToCloudinary, updateProducts);

// Other routes...
router.get("/all", getallProducts);
router.get("/latest", getlatestProducts);
router.get("/category", getallCategories);
router.get("/admin-products", adminOnly, adminProducts);
router.get("/:id", singelProduct);
router.delete("/:id", adminOnly, deleteProduct);

export default router;
