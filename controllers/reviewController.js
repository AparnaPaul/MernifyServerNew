import { Product } from "../models/productModel.js";
import { Review } from "../models/reviewModel.js";
import tryCatch from "../utils/tryCatch.js";

// Create a review
export const createReview = tryCatch(async (req, res) => {
    const { productId, rating, reviewComment } = req.body;

    if (!rating || !reviewComment) {
        return res.status(400).json({
            message: "Rating and comment are required"
        });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    const review = await Review.create({
        userId: req.user.id,
        productId,
        rating,
        reviewComment
    });

    res.status(201).json({
        message: "Review added successfully", review
    });
});

// Get reviews by product
export const getReviewsByProduct = tryCatch(async (req, res) => {
    const reviews = await Review.find({ productId: req.params.productId })
        .populate("userId", "username").exec();

    if (!reviews) {
        return res.status(404).json({
            message: "No reviews found for this product"
        });
    }

    res.json({ reviews });
});

// Delete a review
export const deleteReview = tryCatch(async (req, res) => {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({
            message: "Review not found"
        });
    }
console.log("DEBUGGG", review.userId.toString(), req.user.id, req.user.username)
    // Check if the logged-in user is the owner of the review
    if (review.userId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Not authorized to delete this review"
        });
    }

    await Review.deleteOne({ _id: reviewId }); 
    res.json({
        message: "Review deleted successfully"
    });
});

// Edit a review
export const editReview = tryCatch(async (req, res) => {
    const { reviewId } = req.params;
    const { rating, reviewComment } = req.body;

    // Find the review by ID
    const review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({
            message: "Review not found"
        });
    }

    // Check if the logged-in user is the owner of the review
    if (review.userId.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Not authorized to edit this review"
        });
    }

    // Update the review
    review.rating = rating || review.rating;
    review.reviewComment = reviewComment || review.reviewComment;
    await review.save();

    res.json({
        message: "Review updated successfully",
        review,
    });
});
