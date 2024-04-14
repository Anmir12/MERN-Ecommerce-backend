import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment.js";

const app = express.Router();


///api/v1/payments/create
app.post("/create",createPaymentIntent)

///api/v1/payments/discount
app.get("/discount",applyDiscount)

///api/v1/payments/all
app.get("/all",adminOnly,allCoupons)


///api/v1/payments/coupon/new
app.post("/coupon/new",adminOnly,newCoupon)


///api/v1/payments/:id
app.delete("/:id",adminOnly,deleteCoupon)


export default app;