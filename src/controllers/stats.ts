import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import Order from "../models/orders.js";
import Product from "../models/products.js";
import User from "../models/user.js";
import {  calculatePercantage, getCountArray, getInventory } from "../utils/features.js";

export const getDashBoardRoute = TryCatch(async (req, res, next) => {
  let stats = {};

  const key = "admin-stats";

  if (myCache.has(key)) stats = JSON.parse(myCache.get(key) as string);
  else {
    let today = new Date();

    let sixMonthsAgo = new Date();

    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    let lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const sixMonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestTransactionPromise = Order.find({})
      .select(["discount", "status", "orderItems", "total"])
      .limit(4);

    const [
      thisMonthProducts,
      thisMonthOrders,
      thisMonthUsers,
      lastMonthProducts,
      lastMonthOrders,
      lastMonthUsers,
      userCount,
      productCount,
      allOrders,
      sixMonthsOrders,
      categories,
      femaleCount,
      latestTransactions,
    ] = await Promise.all([
      thisMonthProductsPromise,
      thisMonthOrdersPromise,
      thisMonthUsersPromise,
      lastMonthProductsPromise,
      lastMonthOrdersPromise,
      lastMonthUsersPromise,
      User.countDocuments(),
      Product.countDocuments(),
      Order.find({}).select("total"),
      sixMonthsOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionPromise,
    ]);

    const thisMonthrevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const lastMonthrevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changePercentage = {
      revenue: calculatePercantage(thisMonthrevenue, lastMonthrevenue),

      users: calculatePercantage(thisMonthUsers.length, lastMonthUsers.length),

      orders: calculatePercantage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),

      products: calculatePercantage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      revenue,
      users: userCount,
      products: productCount,
      orders: allOrders.length,
    };

    const orderMonthCounts = new Array(6).fill(0);

    const orderMonthRevenue = new Array(6).fill(0);

    sixMonthsOrders.forEach((order) => {
      const orderCreation = order.createdAt;

      const monthDiff = (today.getMonth() - orderCreation.getMonth() + 12) % 12;

      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;

        orderMonthRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoryCount = await getInventory({ categories, productCount });

    const userRatio = {
      male: userCount - femaleCount,
      female: femaleCount,
    };

    const modifiedLatestTransactions = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      categoryCount,
      changePercentage,
      count,
      charts: {
        orders: orderMonthCounts,
        revenue: orderMonthRevenue,
      },
      userRatio,
      latestTransactions: modifiedLatestTransactions,
    };

    myCache.set(key, JSON.stringify(stats));
  }
  res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieChartRoutes = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-pieChart";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {
    const allOrdersPromise = Order.find({}).select([
      "total",
      "discount",
      "tax",
      "shippingCharges",
      "subtotal",
    ]);

    const [
      orderProcess,
      orderShipping,
      orderDelivered,
      categories,
      productCount,
      outOfStock,
      allOrders,
      userAge,
      adminCount,
      usersCount,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullFillmentRatio = {
      process: orderProcess,
      shipping: orderShipping,
      delivered: orderDelivered,
    };

    const ProductCategories = await getInventory({ categories, productCount });

    const productStock = {
      inStock: productCount - outOfStock,
      outOfStock: outOfStock,
    };

    const totalGrossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const marketingCost = Math.round(totalGrossIncome * (30 / 100));

    const netMargin =
      totalGrossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const userAgeGroup = {
      teen: userAge.filter((i) => i.age < 20).length,
      adult: userAge.filter((i) => i.age >= 20 && i.age < 40).length,
      old: userAge.filter((i) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminCount,
      customer: usersCount,
    };

    charts = {
      orderFullFillmentRatio,
      ProductCategories,
      productStock,
      revenueDistribution,
      userAgeGroup,
      adminCustomer,
    };
    myCache.set(key, JSON.stringify(charts));
  }

  res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarChartRoutes = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-barChart";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {

    let today = new Date();

    let sixMonthsAgo = new Date();

    
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);


    let twelveMonthsAgo = new Date();
    
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);


    const sixMonthsProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthsUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const twelveMonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt")

    const [products,users,orders] = await Promise.all([sixMonthsProductsPromise,sixMonthsUsersPromise,twelveMonthsOrdersPromise]);

    const productsCount = getCountArray(6,products,today);

    const usersCount = getCountArray(6,users,today);

    const ordersCount = getCountArray(12,orders,today);

    charts = {
      users:usersCount,
      products:productsCount,
      orders:ordersCount
    };
    myCache.set(key, JSON.stringify(charts));
  }

  res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineChartRoutes = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-lineChart";

  if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
  else {

    
    let today = new Date();  

    let twelveMonthsAgo = new Date();
    
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const baseQuery ={
    createdAt: {
      $gte: twelveMonthsAgo,
      $lte: today,
    },
  }
  const twelveMonthUsers = User.find(baseQuery).select("createdAt");
  
  const twelveMonthProducts = Product.find(baseQuery).select("createdAt");

    const twelveMonthOrders = Order.find(baseQuery).select(["createdAt","discount","total"]);


    const [users,products,orders] = await Promise.all([twelveMonthUsers,twelveMonthProducts,twelveMonthOrders]);

    const usersCount = getCountArray(12,users,today);

    const productsCount = getCountArray(12,products,today);

    const discount = getCountArray(12,orders,today,"discount");

    const revenue = getCountArray(12,orders,today,"total");
   
    charts = {
      users:usersCount,
      products:productsCount,
     discount,
      revenue
    };
    myCache.set(key, JSON.stringify(charts));
  }

  res.status(200).json({
    success: true,
    charts,
  });
});
