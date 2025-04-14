import { User } from "../models/userModel.js";
import tryCatch from "../utils/tryCatch.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token.js";

const NODE_ENV = process.env.NODE_ENV;


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
  export const signupUser = tryCatch(async (req, res) => {
    const { username, email, password, mobile } = req.body;

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
        username,  // No uniqueness check on username
        email,
        password: hashedPassword,
        mobile,
    });

    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
        { email: user.email, _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );

    res.cookie('token', jwtToken, {
        sameSite: "None",
        secure: false, // Set to true if you're using HTTPS
        httpOnly: false,
        path: "/",
    });

    // Remove the password before sending the response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(201).json({
        message: "Signup success",
        success: true,
        user: userResponse,
    });
});

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
    const { username, mobile, password } = req.body;
  
    // Find user by ID (from decoded JWT token)
    const user = await User.findById(req.user._id); // req.user should have the user from the JWT middleware
  
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
  
    // Update the username and mobile if provided
    if (username) user.username = username;
    if (mobile) user.mobile = mobile;
  
    // If a new password is provided, hash it and update it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
  
    // Save the updated user
    await user.save();
  
    res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: {
        username: user.username,
        mobile: user.mobile,
      },
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