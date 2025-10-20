const express = require('express');
const mongoose = require('mongoose');
const Review = require('../../models/Review');
const Guide = require('../../models/Guide');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// PUT /reviews/update/:reviewId
router.put('/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { 
      rating, 
      comment, 
      images = [],
      travelerId // Required for authorization
    } = req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid review ID' 
      });
    }

    if (!travelerId || !mongoose.Types.ObjectId.isValid(travelerId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Traveler ID is required for authorization' 
      });
    }

    // Find review and verify ownership
    const review = await Review.findOne({ 
      _id: reviewId, 
      travelerId,
      status: 'active'
    });

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        error: 'Review not found or you are not authorized to update it' 
      });
    }

    // Validate update data
    const updateData = {};

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'Rating must be between 1 and 5' 
        });
      }
      updateData.rating = rating;
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Comment cannot be empty' 
        });
      }
      if (comment.length > 1000) {
        return res.status(400).json({ 
          success: false, 
          error: 'Comment must be less than 1000 characters' 
        });
      }
      updateData.comment = comment.trim();
    }

    if (Array.isArray(images)) {
      updateData.images = images;
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updateData },
      { new: true }
    ).populate('guideId', 'username details.firstName details.lastName details.avatar');

    // Update guide metrics
    await updateGuideMetrics(review.guideId);

    res.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully'
    });

  } catch (err) {
    next(err);
  }
});

// Helper function to update guide metrics
async function updateGuideMetrics(guideId) {
  try {
    const reviews = await Review.find({ 
      guideId, 
      status: 'active' 
    }).select('rating');

    if (reviews.length === 0) {
      // No reviews, reset metrics
      await Guide.findByIdAndUpdate(guideId, {
        $set: {
          'metrics.rating': 0,
          'metrics.totalReviews': 0
        }
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update guide metrics
    await Guide.findByIdAndUpdate(guideId, {
      $set: {
        'metrics.rating': Math.round(averageRating * 10) / 10, // Round to 1 decimal
        'metrics.totalReviews': reviews.length
      }
    });

    console.log(`Updated guide ${guideId} metrics: rating=${averageRating.toFixed(1)}, reviews=${reviews.length}`);
  } catch (error) {
    console.error('Error updating guide metrics:', error);
  }
}

module.exports = router;
