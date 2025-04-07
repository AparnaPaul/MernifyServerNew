import jwt from "jsonwebtoken";
import { Admin } from "../models/adminModel.js";

export const isValidAdmin = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Admin not authorized" });
  }

  try {
    // Decode token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken || decodedToken.role !== "admin") {
      return res.status(403).json({ message: "Access denied: not an admin" });
    }

    // Check if admin still exists
    const admin = await Admin.findById(decodedToken._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Attach to req
    req.admin = decodedToken;

    next();
  } catch (error) {
    console.error("isValidAdmin error:", error.message);
    res.status(401).json({
      message: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
};
