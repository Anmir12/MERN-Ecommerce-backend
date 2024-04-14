import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, updateOrder } from "../controllers/orders.js";


const app = express.Router();

//api/v1/orders/new
app.post("/new",newOrder);

//api/v1/orders/my
app.get("/my",myOrders);

//api/v1/orders/all
app.get("/all",adminOnly,allOrders);
//api/v1/orders/:id
app.route("/:id").get(getSingleOrder).put(adminOnly,updateOrder).delete(adminOnly,deleteOrder);


export default app;
