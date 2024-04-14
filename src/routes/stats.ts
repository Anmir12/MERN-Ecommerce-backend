import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getBarChartRoutes, getDashBoardRoute, getLineChartRoutes, getPieChartRoutes } from "../controllers/stats.js";

const app = express.Router();

//api/v1/dashboard/stats
app.get("/stats",adminOnly,getDashBoardRoute);

//api/v1/dashboard/bar
app.get("/bar",adminOnly,getBarChartRoutes);

//api/v1/dashboard/pie
app.get("/pie",adminOnly,getPieChartRoutes);

//api/v1/dashboard/line
app.get("/line",adminOnly,getLineChartRoutes);


export default app;