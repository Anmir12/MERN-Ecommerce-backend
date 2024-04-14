import { NextFunction, Request, Response } from "express";
import User from "../models/user.js";
import { newUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";

export const newUser = TryCatch(async (
  req: Request<{}, {}, newUserRequestBody>,
  res: Response,
  next: NextFunction
) => {
    const { _id, name, email, photo, gender, dob } = req.body;

      let user = await User.findById(_id);

      if(user){

        res.status(201).json({
          success : true,
          message : `welcome ${user.name}`
        })
      }

     if(!name || !_id ||!email || !photo || !gender || !dob){
       return next(new ErrorHandler("Please Enter all fields",400))
     }


     user = await User.create({
      name,
      email,
      photo,
      gender,
      dob :new Date(dob),
      _id,
    });
    return res.status(201).json({
      success: true,
      message: `welcome ${user.name} `,
    });
  }
)


export const getAllUsers = TryCatch(async(req,res,next)=>{
  const users = await User.find({});
  return res.status(200).json({
    success:true,
    users,
  })
});

export const getUser = TryCatch(async(req,res,next)=>{
  const id =req.params.id
  const user = await User.findById(id)
   if(!user) return next(new ErrorHandler("invalid id",400));
  res.status(200).json({
    success :true,
    user,
  })
});

export const deleteUser = TryCatch(async(req,res,next)=>{
  const id =req.params.id
  let user = await User.findById(id)
  if(!user) return next(new ErrorHandler("invalid id",400));
   await user.deleteOne();
  res.status(200).json({
    success :true,
    message : `user ${user.name} Deleted Succesfully `,
  })
});
