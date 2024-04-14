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

//api/v1/products/new
app.post("/new",adminOnly, singleUpload, newProduct);

// api/v1/products/all
app.get("/all", getallProducts);

// api/v1/products/latest
app.get("/latest", getlatestProducts);

//api/v1/products/category
app.get("/category", getallCategories);

//admin products
app.get("/admin-products",adminOnly, adminProducts);

//dynamic routes

app.route("/:id").get(singelProduct).put(adminOnly,singleUpload,updateProducts).delete(adminOnly,deleteProduct);

export default app;
