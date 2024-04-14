import User from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

//MiddelWare To Make Sure Only Admin Is Allowed
export const adminOnly =TryCatch(async(req,res,next)=>{


 const {id} =req.query;

 if(!id) return next(new ErrorHandler("Please Login with valid Id",401));

  const user =await User.findById(id)

  if(!user) return next(new ErrorHandler("please Login First",401));

  if(user.role !== "admin") return next(new ErrorHandler("Only Admin Can Perform This Operation",401))

    next();
})