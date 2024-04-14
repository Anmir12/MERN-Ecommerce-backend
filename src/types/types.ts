import e, { NextFunction, Request, Response } from "express";

export interface newUserRequestBody {
  _id: string;
  name: string;
  email: string;
  gender: string;
  dob: Date;
  photo: string;
}
export interface newProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
}
export type newSearchRequestQuery = {
  search?: string;
  sort?: string;
  category?: string;
  page?: string;
  price?: string;
};

export interface baseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: { $lte: number };
  category?: string;
}

export type invalidateProps = {
  products?: boolean;
  orders?: boolean;
  admin?: boolean;
  userId?:string;
  orderId?:string;
  productId?:string | string[];
};

export type orderItemsType ={
  name:string,
  photo:string,
  price:number,
  quantity:number,
  productId:string
}


export type shippingInfoType ={
  address:string,
  city:string,
  state:string,
  country:string,
  pinCode:number
}


export interface newOrderRequestBody{
 shippingInfo:shippingInfoType,
 user:string,
 total:number,
 subtotal:number,
 shippingCharges:number,
 tax:number,
 discount:number,
 status:string,
 orderItems:orderItemsType[]
}
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;
