const express = require('express');
const mongoose = require('mongoose');
const Review = require('../../models/Review');
const Guide = require('../../models/Guide');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// DELETE /reviews/delete/:reviewId
router.delete('/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { travelerId } = req.body; // Required for authorization

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
        error: 'Review not found or you are not authorized to delete it' 
      });
    }

    const guideId = review.guideId;

    // Soft delete - set status to hidden instead of actually deleting
    await Review.findByIdAndUpdate(reviewId, {
      $set: { status: 'hidden' }
    });

    // Update guide metrics
    await updateGuideMetrics(guideId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
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
