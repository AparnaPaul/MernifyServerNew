import jwt from "jsonwebtoken";
import { Admin } from "../models/adminModel.js";

export const isValidAdmin = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.log("No token found");  // Debugging log
    return res.status(401).json({ message: "Admin not authorized" });
  }

  try {
    // Decode token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken || decodedToken.role !== "admin") {
      console.log("Token decoded but not admin: ", decodedToken);  // Debugging log
      return res.status(403).json({ message: "Access denied: not an admin" });
    }

    console.log("Decoded Token:", decodedToken);
console.log("Trying to find admin with ID:", decodedToken.id);

    // Check if admin still exists
    const admin = await Admin.findById(decodedToken.id);
    if (!admin) {
      console.log("Admin not found in the database");  // Debugging log
      return res.status(404).json({ message: "Admin not found" });
    }

    // Attach to req
    req.admin = admin;
    console.log("Admin:", req.admin); // Log the admin info

    next();
  } catch (error) {
    console.error("isValidAdmin error:", error.message);
    res.status(401).json({
      message: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    });
  }
};
