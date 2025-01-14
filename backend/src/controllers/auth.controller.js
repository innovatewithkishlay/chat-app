import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
export const signup = async (req, res) => {
  const { fullname, email, password } = req.body;
  try {
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be at least of 6 characters." });
    }
    const user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: "user with this email already exists." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      fullname,
      email,
      hashedPassword,
      password: hashedPassword,
    });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res
        .status(400)
        .json({ message: "something went wrong while creating your account" });
    }
  } catch (err) {
    console.log("Error occured in signup controller of auth", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const login = (req, res) => {
  res.send("login page");
};
export const logout = (req, res) => {
  res.send("logout page");
};
