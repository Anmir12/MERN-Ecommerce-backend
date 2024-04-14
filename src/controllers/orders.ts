import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { newOrderRequestBody } from "../types/types.js";
import Order from "../models/orders.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  const key = `my-orders-${user}`;

  let orders = [];

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find({ user });

    myCache.set(key, JSON.stringify(orders));
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  const key = "all-orders";

  let orders = [];

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find().populate("user", "name");

    myCache.set(key, JSON.stringify(orders));
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Order not found", 404));
    myCache.set(key, JSON.stringify(order));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, newOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      shippingCharges,
      total,
      subtotal,
      tax,
      discount,
      user,
    } = req.body;

    if (
      !shippingCharges ||
      !shippingInfo ||
      !tax ||
      !total ||
      !subtotal ||
      !orderItems ||
      !user
    )
      return next(new ErrorHandler("please enter all fields", 400));

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    await reduceStock(orderItems);

    await invalidatesCache({
      products: true,
      orders: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  }
);

export const updateOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("invalid id", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;

    case "Shipped":
      order.status = "Delivered";
      break;

    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  await invalidatesCache({
    products: false,
    orders: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  res.status(200).json({
    success: true,
    message: "Order Proccesed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("invalid order id", 404));

  await order.deleteOne();

  await invalidatesCache({
    products: false,
    orders: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
