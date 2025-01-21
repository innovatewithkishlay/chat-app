import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Unauthorised - token not provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(400)
        .json({ message: "Unathourised token- invalid token" });
    }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found in database" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log(
      "erro occured in while veryfying the cookies in auth middleware",
      err
    );
    res.status(500).json({ message: "Internal server error " });
  }
};
