import express from "express";
import { checkUser, deactivateAccount, loginUser, logoutUser, myProfile, signupUser, updateUserProfile } from "../controllers/userController.js";
import { loginValidation, signupValidation } from "../middlewares/authValidation.js";
import { isValidUser } from "../middlewares/isValidUser.js";

const router = express.Router();

router.post('/user/login', loginValidation,loginUser)
router.post('/user/signup', signupUser)
router.get('/user/me', isValidUser, myProfile)
router.post('/user/logout', logoutUser)
router.put('/user/update-profile', isValidUser, updateUserProfile)
router.post('/user/deactivate/:id', isValidUser, deactivateAccount)
router.get('/check-user', isValidUser, checkUser)




export default router;
