import User from "../models/User.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
//middleware to protect route
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }
    req.user = user; //adding user data in the request
    next();
  } catch (error) {
    console.log("Error occured while authenticating user", error.message);
    return res.status(401).json({
      success: false,
      message: "Error occured while authenticating ",
    });
  }
};
