import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  baseQuery,
  newProductRequestBody,
  newSearchRequestQuery,
} from "../types/types.js";
import Product from "../models/products.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";



//revalidate when new,update,delete and new order changes
export const getlatestProducts = TryCatch(async (req, res, next) => {
  
  let products;

  if(myCache.has("latest-Products")) products = JSON.parse(myCache.get("latest-products") as string)

  else{

    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);

    myCache.set("latest-products",JSON.stringify(products))

  }
  
  if (!products) return next(new ErrorHandler("invalid product id", 400));


  res.status(200).json({
    success: true,
    products,
  });
});

//revalidate when new,update,delete and new order changes
export const getallCategories = TryCatch(async (req, res, next) => {
    
  let categories;
   
  if(myCache.has("categories")) categories = JSON.parse(myCache.get("categories") as string);

  else{
    categories = await Product.distinct("category");
    myCache.set("categories",JSON.stringify(categories))
  }
   

  if (!categories) return next(new ErrorHandler("no products found", 404));

  res.status(200).json({
    success: true,
    categories,
  });
});

//revalidate when new,update,delete and new order changes
export const adminProducts = TryCatch(async (req, res, next) => {

  let products;

  if(myCache.has("admin-products")) products = JSON.parse(myCache.get(("admin-products")) as string);

  else{
    
    products = await Product.find({});

    myCache.set("admin-products",JSON.stringify(products))
  }


  if (!products) return next(new ErrorHandler("no products found", 404));

  res.status(200).json({
    success: true,
    products,
  });
});

//revalidate when new,update,delete and new order changes
export const singelProduct = TryCatch(async (req, res, next) => {
  const  id  = req.params.id;

  let product;

  if(myCache.has(`product-${id}`))  product =JSON.parse(myCache.get(`product-${id}`)as string);

  else{
    product = await Product.findById(id);
     
    myCache.set(`product-${id}`,JSON.stringify(product))
  }


  if (!product) return next(new ErrorHandler("no product found", 404));

  res.status(200).json({
    success: true,
    product,
  });
});

export const newProduct = TryCatch(
  async (req: Request<{}, {}, newProductRequestBody>, res, next) => {
    try {
      const { name, price, category, stock } = req.body;
      const photo = req.file;

      // Ensure photo is uploaded
      if (!photo) {
        return next(new ErrorHandler("Please upload an image", 400));
      }

      // Create new product instance
      const newProduct = new Product({
        name,
        price,
        category: category.toLowerCase(),
        stock,
        photo: photo.path, // Assuming Multer provides the file path in req.file
      });

      // Save the new product to MongoDB
      await newProduct.save();

      // Invalidate cache
      await invalidatesCache({ products: true, admin: true });

      // Respond with success message
      res.status(201).json({ success: true, message: "Product created successfully" });
    } catch (error) {
      console.error("Error creating product:", error);
      next(error); // Pass error to error middleware
    }
  }
);

export const updateProducts = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  //   if (!id) return next(new ErrorHandler("enter valid product id", 400));

  const { name, price, category, stock } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("no products found", 404));

  if (photo) {
    rm(product.photo!, () => {
      console.log("deleted old photo");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock !== undefined && stock > 0) {
    product.stock = stock;
  }
  if (category) product.category = category;

  await product.save();

  await invalidatesCache({products:true,productId:String(product._id),admin:true});
 
  res.status(200).json({
    success: true,
    message: "product updated successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  if (!id) return next(new ErrorHandler("enter valid product id", 400));

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("no product found", 404));

  rm(product.photo!, () => {
    console.log("deleted old photo");
  });

  await product.deleteOne();

  await invalidatesCache({products:true,productId:String(product._id),admin:true});

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const getallProducts = TryCatch(
  async (req: Request<{}, {}, {}, newSearchRequestQuery>, res, next) => {
    const { search, sort, price, category } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

    const skip = (page - 1) * limit;

    const baseQuery: baseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find( baseQuery ).sort(sort && {price:sort === "asc"? 1 :-1}).limit(limit).skip(skip);

    const [products,filteredProducts] =await Promise.all([productsPromise,Product.countDocuments(baseQuery)])

    const totalPages = Math.ceil(filteredProducts/limit);


    res.status(200).json({
      success: true,
      products,
      totalPages
    });
  }
);
