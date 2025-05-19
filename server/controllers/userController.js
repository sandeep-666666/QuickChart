import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

//Sign up new user
export const Signup = async (req, res) => {
  try {
    const { fullName, email, password, bio } = req.body;
    if (!fullName || !email || !password || !bio) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Account already exists",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });
    if (!newUser) {
      return res.status(400).json({
        success: false,
        message: "New user could not be created",
      });
    }

    const token = generateToken(newUser._id);
    res.status(200).json({
      success: true,
      userData: newUser,
      token,
      message: "Account Created successfully",
    });
  } catch (error) {
    console.log(
      "Error occured while signingup please try again later",
      error.message
    );
    return res.status(400).json({
      success: flase,
      message: "Error occured while signing up",
    });
  }
};

//user login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required to signin",
      });
    }
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: "User does not exist please Signup",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: flase,
        message: "Invalid credentials please check the details and try again",
      });
    }

    const token = generateToken(userData._id);
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      userData: userData,
      token,
    });
  } catch (error) {
    console.log("Error occured while loggin in", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to log in please try again later",
    });
  }
};

//controller to check if user is authenticated
export const checkAuth = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

//update user profile
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;

    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.log("Error occured while updating user", error.message);
    return res.status(401).json({
      success: false,
      message: "Error occured while updating user please try again later",
    });
  }
};
