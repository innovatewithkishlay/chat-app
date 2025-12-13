import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    plan: {
      type: String,
      enum: ["FREE", "PRO"],
      default: "FREE",
    },
    usage: {
      imagesSent: { type: Number, default: 0 },
      videosSent: { type: Number, default: 0 },
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    lastUsageReset: {
      type: Date,
      default: Date.now,
    },
    mood: {
      status: { type: String, default: "" }, // e.g., "Focused", "Busy"
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
