import { User } from "../models/userModel.js";
import tryCatch from "../utils/tryCatch.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token.js";

const NODE_ENV = process.env.NODE_ENV;

const generateUserToken = (userId) => {
  return jwt.sign(
    { 
        id: userId, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export const signupUser = tryCatch(async (req, res) => {
  const { username, email, password, mobile } = req.body;

  // Log the incoming request body
  console.log("Signup request body:", req.body);

  // Validate all required fields
  if (!username || !email || !password || !mobile) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }

  // Check if the email already exists (ignore username uniqueness)
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      message: "Email already exists, you can login",
      success: false,
    });
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create and save the user
  const user = new User({
    username,
    email,
    password: hashedPassword,
    mobile,
  });

  await user.save();

  const token = generateUserToken(user._id);

  res.cookie("token", token, {
    sameSite: NODE_ENV === "production" ? "None" : "Lax",
    secure: NODE_ENV === "production",
    httpOnly: NODE_ENV === "production",
    path: "/",
  });

  const { password: _, ...userResponse } = user._doc;

  res.status(201).json({
    message: "Signup success",
    success: true,
    user: { ...userResponse, role: "user" },
  });
});


export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExist = await User.findOne({ email });

    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = bcrypt.compareSync(password, userExist.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(userExist._id, "user");

    res.cookie("token", token, {
      sameSite: NODE_ENV === "production" ? "None" : "Lax",
      secure: NODE_ENV === "production",
      httpOnly: NODE_ENV === "production",
    });

    delete userExist._doc.password;
    res.json({
      user: {
        username: userExist.username,
        email: userExist.email,
        role: "user",
      },
      message: "Login success",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
};


export const myProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Remove password from the response
  const userResponse = { ...user._doc };
  delete userResponse.password;

  res.json(userResponse);
});

export const logoutUser = tryCatch(async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    message: "Logged out successfully",
    success: true
  });
});

export const updateUserProfile = tryCatch(async (req, res) => {
  const { username, mobile, oldPassword, newPassword } = req.body;

  // Find user by ID (from decoded JWT token)
  const user = await User.findById(req.user._id); // req.user should have the user from the JWT middleware

  if (!user) {
    return res.status(404).json({ message: "User not found", success: false });
  }

  // Update the username and mobile if provided
  if (username) user.username = username;
  if (mobile) user.mobile = mobile;

  // If old password is provided, check if it matches the current password
  if (oldPassword) {
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // If the old password matches, hash the new password (if provided) and update it
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword; // Store the hashed new password
    }
  }

  // Save the updated user
  await user.save();

  // Remove the password from the response object to avoid sending it back to the client
  const { password: _, ...userResponse } = user._doc;

  // Return the updated user details excluding the password
  res.status(200).json({
    message: "Profile updated successfully",
    success: true,
    user: userResponse, // Return the updated user details
  });
});


export const deactivateAccount = tryCatch(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.clearCookie('token');
  res.status(200).json({
    message: "Account deactivated successfully",
    success: true
  });
});

export const checkUser = async (req, res, next) => {
  try {
    res.json({ message: "user autherized" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Internal server" });
  }
};