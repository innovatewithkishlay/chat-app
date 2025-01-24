import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, recieverId: userToChatId },
        { senderId: userToChatId, recieverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    console.log("Request Body:", req.body);

    const { id: recieverId } = req.params;
    console.log("Receiver ID:", recieverId);

    const senderId = req.user?._id;
    console.log("Sender ID:", senderId);

    let imageUrl;
    if (image) {
      const imageUpload = await cloudinary.uploader.upload(image);
      imageUrl = imageUpload.secure_url;
      console.log("Uploaded Image URL:", imageUrl);
    }

    const newMessage = new Message({
      recieverId,
      senderId,
      text,
      image: imageUrl,
    });

    await newMessage.save(); // Save the message to the database
    res.status(201).json(newMessage); // Respond with the saved message
  } catch (error) {
    console.error("Error in sendMessage:", error.message, error.stack); // Log the full error
    res.status(500).json({ message: "Internal server error" });
  }
};
