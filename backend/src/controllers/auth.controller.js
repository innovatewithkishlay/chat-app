import crypto from "crypto";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { isValidEmailDomain } from "../lib/utils/domainValidator.js";
import { redisClient } from "../lib/redis.js";
import { sendPasswordResetEmail } from "../lib/email.js";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;

const RESET_REQUEST_LIMIT = 3;
const RESET_REQUEST_WINDOW_SECONDS = 60 * 60;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const rateLimitKey = `password_reset_requests:${email.toLowerCase()}`;
    const requestCount = await redisClient.incr(rateLimitKey);
    if (requestCount === 1) {
      await redisClient.expire(rateLimitKey, RESET_REQUEST_WINDOW_SECONDS);
    }

    // Always respond the same way whether or not the email is registered,
    // and whether or not the rate limit was hit, so this endpoint can't be
    // used to enumerate which emails have accounts.
    const genericResponse = {
      message: "If that email is registered, a password reset link has been sent.",
    };

    if (requestCount > RESET_REQUEST_LIMIT) {
      return res.status(200).json(genericResponse);
    }

    const user = await User.findOne({ email });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${clientUrl}/reset-password/${rawToken}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    console.error("Error in forgotPassword controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({
        message: "A valid reset link and a password of at least 6 characters are required.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("Error in resetPassword controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
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
