import express from "express";
import { config } from "dotenv";
import cors from "cors";

//DataBase Connection
import { connectDB } from "./utils/features.js";
// user routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/orders.js";
import paymentsRoute from "./routes/payment.js";

//admin routes

import dashBoardRoutes from "./routes/stats.js";

//Middelwares
import { errorMiddelWare } from "./middlewares/error.js";
//caching
import NodeCache from "node-cache";
import morgan from "morgan";
import Stripe from "stripe";

//dotenv setup

config({
  path: "./.env",
});

// console.log(process.env.PORT);

const port = process.env.PORT || 4000;

const mongoURI = process.env.MONGO_URL || "";

const stripeKey = process.env.STRIPE_KEY || "";

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();

const app = express();

app.use(express.json());

app.use(morgan("dev"));

app.use(cors());

app.get("/", (req, res) => {
  res.send(`home route working at ${port}`);
});

app.use("/api/v1/user", userRoute);

app.use("/api/v1/products", productRoute);

app.use("/api/v1/orders", orderRoute);

app.use("/api/v1/payments", paymentsRoute);

app.use("/api/v1/dashboard", dashBoardRoutes);

app.use("/uploads", express.static("uploads"));

app.use(errorMiddelWare);

app.listen(port, () => {
  console.log(`listening at port ${port} `);
});
