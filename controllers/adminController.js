import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel.js";
import tryCatch from "../utils/tryCatch.js";
import jwt from "jsonwebtoken";
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
// Update admin profile with optional password change
export const updateAdminProfile = tryCatch(async (req, res) => {
  const { username, mobile, newPassword } = req.body;

  const updateData = { username, mobile };

  // If a new password is provided, hash it and add it to the updateData
  if (newPassword) {
    // Generate a salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    updateData.password = hashedPassword; // Store the hashed password
  }

  // Update the admin profile in the database
  const admin = await Admin.findByIdAndUpdate(req.admin._id, updateData, { new: true });

  // Invalidate the old JWT token immediately after the password change
  res.clearCookie("token");

  // Log the updated admin object for debugging
  console.log("Updated Admin Profile:", admin);

  // Remove the password from the response object to avoid sending it back to the client
  const { password: _, ...adminResponse } = admin._doc;

  // Return the updated admin details excluding the password
  res.status(200).json({
    message: "Profile updated successfully, please log in again.",
    success: true,
    admin: adminResponse,
  });
});


//Add new Admin
//____________________

export const addNewAdmin = tryCatch(async (req, res) => {
  const { username, email, password, mobile } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'Admin already exists with this email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await Admin.create({
    username,
    email,
    mobile,
    password: hashedPassword,
    role: "admin", // Ensure role is set
  });

  res.status(201).json({
    message: "New admin created successfully",
    adminId: newAdmin._id,
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


