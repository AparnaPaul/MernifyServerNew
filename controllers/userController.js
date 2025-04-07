import { User } from "../models/userModel.js";
import tryCatch from "../utils/tryCatch.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token.js";

const NODE_ENV = process.env.NODE_ENV;

export const loginUser = async (req, res, next) => {
    try {
        //collect user data
        const { email, password} = req.body;

        //data validation
        if (!email || !password) {
            return res.status(400).json({ message: "all fields required" });
        }

        // user exist - check
        const userExist = await User.findOne({ email });

        if (!userExist) {
            return res.status(404).json({ message: "user not found" });
        }

        //password match with DB
        const passwordMatch = bcrypt.compareSync(password, userExist.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "invalid credentials" });
        }

        //generate token
        const token = generateToken(userExist._id, "user");

        //store token
        res.cookie("token", token, {
            sameSite: NODE_ENV === "production" ? "None" : "Lax",
            secure: NODE_ENV === "production",
            httpOnly: NODE_ENV === "production",
        });

        delete userExist._doc.password;
        res.json({ user: {
            username: userExist.username,
            email: userExist.email,
            role: "user",
         }, message: "Login success" });

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal server" });
    }
};


export const signupUser = tryCatch(async (req, res) => {
    const { username, email, password, mobile } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({
            message: "User already exists, you can login",
            success: false
        });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const user = new User({
        username,
        email,
        password: hashedPassword,
        mobile
    });

    await user.save();

    const jwtToken = jwt.sign(
        { email: user.email, _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );

    // Store token in cookie
    res.cookie('token', jwtToken, { sameSite: "None",
        secure: false,
        httpOnly: false, path: "/",
    });

    // Remove password from the response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(201).json({
        message: "Signup success",
        success: true,
        user: userResponse
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

export const updateProfile = tryCatch(async (req, res) => {
    const { username, mobile } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { username, mobile }, { new: true });

    // Remove password from the response
    const userResponse = { ...user._doc };
    delete userResponse.password;

    res.status(200).json({
        message: "Profile updated successfully",
        success: true,
        user: userResponse
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