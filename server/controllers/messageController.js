import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

//get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    //counting number od messages not seen
    const unSeenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unSeenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.status(200).json({
      success: true,
      users: filteredUsers,
      unSeenMessages,
    });
  } catch (error) {
    console.log(
      "Error occured while fetching all the messages",
      error.messages
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all the messages please try again later",
    });
  }
};

//get all the messages for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.log(
      "Error occured while getting messages for perticular user",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages for this user",
    });
  }
};

//controller to mark message as seen using messageId
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    return res.status(200).json({
      success: true,
      message: "Message is merked as seen successfully",
    });
  } catch (error) {
    console.log(
      "Error occured while marking individual messages as seen",
      error.message
    );
    return res.status(400).json({
      success: false,
      message: "Failed to mark individual messages as seen",
    });
  }
};

//send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    //Emit the new message to the receivers socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    console.log(
      "Error occured while sending message to this user",
      error.message
    );
    return res.status(400).json({
      success: false,
      message: "Faild to send message please try again later",
    });
  }
};
