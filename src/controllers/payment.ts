import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";


export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount} = req.body;

    if (!amount) {
      return next(new ErrorHandler("Please Enter the Amount", 400));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      description: "payment",
      currency: "inr",
    });


  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});


export const newCoupon = TryCatch(async (req, res, next) => {
  const { code, amount } = req.body;

  if (!code || !amount)
    return next(new ErrorHandler("please Enter both code and amount", 400));

  await Coupon.create({ code, amount });

  res.status(201).json({
    success: true,
    message: `coupon ${code} created Successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { code:coupon } = req.query;
  
  const discount = await Coupon.findOne( {code:coupon} );

  if (!discount)
    return next(new ErrorHandler("please enter Valid Coupon code", 400));

  res.status(200).json({
    success: true,
    message: discount.amount,
  });
});

export const allCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  if (!coupons) return next(new ErrorHandler("no coupons found", 401));

  res.status(200).json({
    success: true,
    coupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("invalid coupon id", 401));

  res.status(200).json({
    success: true,
    message: `coupon ${coupon.code} deleted Successfully`,
  });
});
