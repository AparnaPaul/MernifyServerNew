import express from "express";
import { isValidUser } from "../middlewares/isValidUser.js";
import { createReview, getReviewsByProduct, deleteReview, editReview} from "../controllers/reviewController.js"

const router = express.Router();

router.post('/review/add', isValidUser, createReview)
router.get('/review/:productId',  getReviewsByProduct)
router.delete('/review/:reviewId', isValidUser, deleteReview)
router.put('/review/:reviewId', isValidUser, editReview)


export default router;