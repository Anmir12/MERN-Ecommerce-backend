import express from "express";
import { adminOnly } from "../middlewares/auth.js";
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
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

//To Create New Product  - /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

//To get all Products with filters  - /api/v1/product/all
app.get("/all", getallProducts);

//To get last 10 Products  - /api/v1/product/latest
app.get("/latest", getlatestProducts);

//To get all unique Categories  - /api/v1/product/categories
app.get("/categories", getallCategories);

//To get all Products   - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, adminProducts);

// To get, update, delete Product
app
  .route("/:id")
  .get(singelProduct)
  .put(adminOnly, singleUpload, updateProducts)
  .delete(adminOnly, deleteProduct);

export default app;