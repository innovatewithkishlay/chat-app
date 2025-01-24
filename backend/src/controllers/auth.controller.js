import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { isValidEmailDomain } from "../lib/utils/domainValidator.js";
export const signup = async (req, res) => {
  const { fullname, email, password } = req.body;
  try {
    if (!isValidEmailDomain(email)) {
      return res.status(400).json({
        message:
          "Invalid email domain. Please use a valid domain like gmail.com, yahoo.com, etc.",
      });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be at least of 6 characters." });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "user with this email already exists." });
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
        about: "",
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
      profilePic: user.profilePic,
    });
  } catch (err) {
    console.log(
      "something went wrong while handling the controller in login ",
      err
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
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullname, about } = req.body;
    const userId = req.user._id;
    const updateData = {};
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }
    if (fullname) {
      updateData.fullname = fullname;
    }
    if (about) {
      updateData.about = about;
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    console.log(updatedUser);
    res.status(200).json(updatedUser); // Return the updated user info
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
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
