import express from "express";
import { loginValidation, signupValidation } from "../middlewares/authValidation.js";
import { isValidAdmin } from "../middlewares/isValidAdmin.js";
import { signupAdmin, loginAdmin, logoutAdmin, myProfile, deactivateAdminAccount, updateAdminProfile, addNewAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.post('/admin/login', loginValidation, loginAdmin)
router.post('/admin/signup', signupValidation, signupAdmin)
router.get('/admin/me', isValidAdmin, myProfile)
router.get('/admin/logout', logoutAdmin)
router.put('/admin/update-profile', isValidAdmin, updateAdminProfile)
router.post('/admin/addAdmin', isValidAdmin, addNewAdmin)

router.post('/admin/deactivate/:id', isValidAdmin, deactivateAdminAccount)



export default router;
