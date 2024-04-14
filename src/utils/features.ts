import mongoose from "mongoose";
import { invalidateProps, orderItemsType } from "../types/types.js";
import { myCache } from "../app.js";
import Product from "../models/products.js";

export const connectDB =  (URI : string) => {
   mongoose
    .connect(URI, {
      dbName: "MernEcommerce2024",
    })
    .then((c) => console.log(`DB connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidatesCache =async({
  products,
  orders,
  admin,
  orderId,
  productId,
  userId
}: invalidateProps) => {

  if(products)  {
     
     const productKeys:string[] =["latest-Products","categories","admin-products",`product-${productId}`];

   if(typeof productId ==="string") productKeys.push(`product-${productId}`)

   if(typeof productId ==="object") productId.forEach((i) => productKeys.push(`product-${i}`));

    myCache.del(productKeys)
  }

  if(orders) {
    const orderKeys:string[] =["all-orders",`my-orders-${userId}`,`order-${orderId}`]
    myCache.del(orderKeys)
  }

  if(admin){

    myCache.del(["admin-stats","admin-pieChart","admin-barChart","admin-lineChart"])
  }

};

export const reduceStock = async(orderItems:orderItemsType[])=>{
 
   for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];

    const product =await Product.findById(order.productId);

    if(!product) throw new Error("product not found");

    product.stock -= order.quantity;
     
    await product.save();
   }
}

export const calculatePercantage = (thisMonth:number,lastMonth:number)=>{
 
  if(lastMonth === 0)  return thisMonth * 100

  const percentage = (thisMonth/lastMonth) * 100;

  return Number(percentage.toFixed(0)) ;

}

export const getInventory = async({categories,productCount}:{categories:string[],productCount:number})=>{

 const categoryCountPromise = categories.map((category) =>
  Product.countDocuments({ category })
);

const categoriesCount = await Promise.all(categoryCountPromise);

const categoryCount: Record<string, number>[] = [];

categories.forEach((category, i) => {
  categoryCount.push({
    [category]: Math.round((categoriesCount[i] / productCount) * 100),
  });
});
return categoryCount;
}

interface MyDocument {
  createdAt: Date;
  discount?:number | null;
  total?:number  | null;
  // Add any additional properties shared by Product, User, and Order
}

type CountArray = number[];

type CountFunction = {
  (length: number, docArr: MyDocument[], today: Date,property?:"discount" | "total"): CountArray;
};

export const getCountArray: CountFunction = (length, docArr, today,property) => {
  const counts: CountArray = new Array(length).fill(0);

  docArr.forEach((item) => {
    const itemCreation = item.createdAt;
    const monthDiff = (today.getMonth() - itemCreation.getMonth() + 12) % 12;

    if (monthDiff < length) {

      if(property){
        counts[length - monthDiff - 1] += item[property]!;
      }
      else{

        counts[length - monthDiff - 1] += 1;
      }
    }
  });

  return counts;
};
