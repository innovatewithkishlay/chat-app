import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
export const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Database connected ${conn.connection.host}`);
  } catch (err) {
    console.log(`error occured`, err);
  }
};
