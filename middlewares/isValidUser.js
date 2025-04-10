import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js"; // ⬅️ make sure this is correct path

export const isValidUser = async (req, res, next) => {
  const token = req.cookies.token;
  console.log("Token ----", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token ===", decodedToken);

    const user = await User.findById(decodedToken.id); // ✅ Fetch full user
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // ✅ Attach full user object to req
    console.log("User set on req.user ===", req.user);

    next();
  } catch (error) {
    console.log("Auth error ===", error);
    res.status(401).json({ message: "User not authorized" });
  }
};
