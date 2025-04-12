import { Admin } from "../models/adminModel.js";
import tryCatch from "../utils/tryCatch.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Order } from "../models/orderModel.js";

const NODE_ENV = process.env.NODE_ENV;

// Utility to generate token
const generateAdminToken = (adminId) => {
  return jwt.sign(
    { 
        id: adminId, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// =======================
//       LOGIN ADMIN
// =======================
export const loginAdmin = tryCatch(async (req, res) => {
  const { email, password } = req.body;

    // Find admin in the database
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(403).json({ message: "Invalid credentials", success: false });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(403).json({ message: "Invalid credentials", success: false });
  }

  const token = generateAdminToken(admin._id);

  res.cookie("token", token, {
    sameSite: NODE_ENV === "production" ? "None" : "Lax",
    secure: NODE_ENV === "production",
    httpOnly: NODE_ENV === "production",
    path: "/",
  });

  const { password: _, ...adminResponse } = admin._doc;
  res.status(200).json({
    message: "Login success",
    success: true,
    admin: { ...adminResponse, role: "admin" },
  });
});

// =======================
//     SIGNUP ADMIN
// =======================
export const signupAdmin = tryCatch(async (req, res) => {
  const { username, email, password, mobile } = req.body;

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return res.status(409).json({ message: "Admin already exists", success: false });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new Admin({ username, email, password: hashedPassword, mobile });

  await admin.save();
  console.log("Admin created:", admin);


  const token = generateAdminToken(admin._id);

  res.cookie("token", token, {
    sameSite: NODE_ENV === "production" ? "None" : "Lax",
    secure: NODE_ENV === "production",
    httpOnly: NODE_ENV === "production",
    path: "/",
  });

  const { password: _, ...adminResponse } = admin._doc;
  res.status(201).json({
    message: "Signup success",
    success: true,
    admin: { ...adminResponse, role: "admin" },
  });
});

// =======================
//     ADMIN PROFILE
// =======================
export const myProfile = tryCatch(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  const { password: _, ...adminData } = admin._doc;
  res.json(adminData);
});

// =======================
//     LOGOUT ADMIN
// =======================
export const logoutAdmin = tryCatch(async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully", success: true });
});

// =======================
//   UPDATE ADMIN PROFILE
// =======================
export const updateAdminProfile = tryCatch(async (req, res) => {
  const { username, mobile } = req.body;
  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    { username, mobile },
    { new: true }
  );

  const { password: _, ...adminResponse } = admin._doc;
  res.status(200).json({
    message: "Profile updated successfully",
    success: true,
    admin: adminResponse,
  });
});

// =======================
// DEACTIVATE ADMIN ACCOUNT
// =======================
export const deactivateAdminAccount = tryCatch(async (req, res) => {
  await Admin.findByIdAndDelete(req.admin._id);
  res.clearCookie("token");
  res.status(200).json({
    message: "Account deactivated successfully",
    success: true,
  });
});


