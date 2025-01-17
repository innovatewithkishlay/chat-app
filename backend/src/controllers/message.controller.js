import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const allUsers = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    );
    res.status(201).json(allUsers);
  } catch (err) {
    console.log(
      "something went wrong in the message controller auth ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
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
    res.status(201).json(messages);
  } catch (err) {
    console.log("something went wrong in message controller.js", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: recieverId } = req.params;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {
      const imageupload = await cloudinary.uploader.upload(image);
      imageUrl = imageupload.secure_url;
    }
    const newMessage = new Message({
      recieverId,
      senderId,
      text,
      image: imageUrl,
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.log(
      "something went wrong in sendMessage controller in message controller",
      error.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
