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
import {
  uploadOnCloundinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

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
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add Photo", 400));

    if (!name || !price || !stock || !category) {
        return next(new ErrorHandler("Please enter All Fields", 400));
    }

    const avatar = await uploadOnCloundinary(photo?.path);

    if (!avatar) return next(new ErrorHandler("file upload error", 500));



    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: avatar?.url,
    });

    invalidatesCache({ products: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);
export const updateProducts = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  //   if (!id) return next(new ErrorHandler("enter valid product id", 400));

  const { name, price, category, stock } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("no products found", 404));

   let avatar;

  if (photo) {

    await deleteFromCloudinary(product.photo!);

    avatar = await uploadOnCloundinary(photo.path);

    if (!avatar) return next(new ErrorHandler("file upload error", 500));

    product.photo = avatar?.url;
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

  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("no product found", 404));

   await deleteFromCloudinary(product.photo!)

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