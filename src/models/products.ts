import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name :{
        type :String,
        required :[true,"Please Enter The Name Of The Product"]
    },
    category :{
        type :String,
        required :[true,"Please Select The Category"]
    },
    price :{
        type :Number,
        required :[true,"Please Enter The Amount"]
    },
    stock:{
        type :Number,
        required :[true,"Please Enter The Quantity"]
    },
    photo:{
        type :String,
        required :[true,"Please Upload An Image"]
    },

  },
  {
    timestamps: true,
  }
);


const Product = mongoose.model("Product", schema);

export default Product;

