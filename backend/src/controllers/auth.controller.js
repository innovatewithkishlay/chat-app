import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
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
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      profilepic: user.profilePic,
    });
  } catch (err) {
    console.log(
      "something went wrong while handling the controller in login ",
      err.message
    );
    res.status(500).json({ message: "Internal error" });
  }
};
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "successfully logged out" });
  } catch (error) {
    console.log(
      "something went wrong while handling the logout in controllers ",
      error.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateprofile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) {
      return res
        .status(400)
        .json({ message: "please provide valid profile pic" });
    }
    const userPic = await cloudinary.uploader.upload(profilePic);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePic: userPic.secure_url,
      },
      { new: true }
    );
    res.status(200).json({ message: "Profile picture updated successfully" });
  } catch (err) {
    console.log(
      "error occured in  authcontroller of update profile ",
      err.message
    );
    res.status(500).json({ message: "Internal error occured" });
  }
};
export const checkUser = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.log(
      "something went wrong while checking the user in auth checkuser",
      err.message
    );
    res.status(500).json({ message: "Internal server error " });
  }
};
