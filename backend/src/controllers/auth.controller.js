import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { isValidEmailDomain } from "../lib/utils/domainValidator.js";
import { redisClient } from "../lib/redis.js";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;

async function registerFailedLoginAttempt(email) {
  const attemptsKey = `login_attempts:${email.toLowerCase()}`;
  const attempts = await redisClient.incr(attemptsKey);
  if (attempts === 1) {
    await redisClient.expire(attemptsKey, LOGIN_ATTEMPT_WINDOW_SECONDS);
  }
}

export const signup = async (req, res) => {
  const { fullname, email, password, username } = req.body;
  try {
    if (!isValidEmailDomain(email) || password.length < 6) {
      return res.status(400).json({
        message: !isValidEmailDomain(email)
          ? "Invalid email."
          : "Password must be at least 6 characters.",
      });
    }

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    // Check for existing user by email OR username
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      const message = user.email === email
        ? "User with this email already exists."
        : "Username is already taken.";
      return res.status(400).json({ message });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      fullname,
      email,
      username,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        username: newUser.username,
        profilePic: newUser.profilePic,
        plan: newUser.plan,
        about: "",
      });
    } else {
      res
        .status(400)
        .json({ message: "Something went wrong while creating your account." });
    }
  } catch (err) {
    console.error("Error in signup controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!isValidEmailDomain(email) || !password) {
      return res.status(400).json({
        message: !isValidEmailDomain(email)
          ? "Invalid email."
          : "Password is required.",
      });
    }

    const attemptsKey = `login_attempts:${email.toLowerCase()}`;
    const attempts = Number((await redisClient.get(attemptsKey)) || 0);
    if (attempts >= LOGIN_ATTEMPT_LIMIT) {
      return res.status(429).json({
        message: "Too many failed login attempts. Try again in a few minutes.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await registerFailedLoginAttempt(email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      await registerFailedLoginAttempt(email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await redisClient.del(attemptsKey);
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      profilePic: user.profilePic,
      plan: user.plan,
    });
  } catch (err) {
    console.error("Error in login controller:", err.message);
    res.status(500).json({ message: "Internal error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "successfully logged out" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
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

    res.status(200).json(updatedUser); // Return the updated user info
  } catch (error) {
    console.error("Error in update profile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkUser = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.error("Error in checkUser controller:", err.message);
    res.status(500).json({ message: "Internal server error " });
  }
};
