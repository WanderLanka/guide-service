const express = require('express');
const mongoose = require('mongoose');
const Review = require('../../models/Review');
const Guide = require('../../models/Guide');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// POST /reviews/create
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { 
      guideId, 
      rating, 
      comment, 
      bookingId,
      images = []
    } = req.body;

    // Get traveler info from JWT token
    const travelerId = req.user.userId;
    const travelerName = req.user.username;
    const travelerEmail = req.user.email;
    const travelerAvatar = req.user.avatar || null;

    // Validation
    if (!guideId || !mongoose.Types.ObjectId.isValid(guideId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid guideId is required' 
      });
    }

    if (!travelerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User authentication required' 
      });
    }

    if (!travelerName || typeof travelerName !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Traveler name is required' 
      });
    }

    if (!travelerEmail || typeof travelerEmail !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Traveler email is required' 
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comment is required' 
      });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comment must be less than 1000 characters' 
      });
    }

    // Check if guide exists
    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ 
        success: false, 
        error: 'Guide not found' 
      });
    }

    // Check if review already exists for this traveler and guide
    const existingReview = await Review.findOne({ 
      guideId, 
      travelerId 
    });

    if (existingReview) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already reviewed this guide' 
      });
    }

    // Create review
    const review = new Review({
      guideId,
      travelerId,
      travelerName: travelerName.trim(),
      travelerEmail: travelerEmail.trim(),
      rating,
      comment: comment.trim(),
      bookingId: bookingId && mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : undefined,
      images: Array.isArray(images) ? images : [],
      isVerified: !!bookingId // Verified if associated with a booking
    });

    await review.save();

    // Update guide metrics
    await updateGuideMetrics(guideId);

    // Return created review with populated data
    const populatedReview = await Review.findById(review._id)
      .populate('guideId', 'username details.firstName details.lastName')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedReview,
      message: 'Review created successfully'
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already reviewed this guide' 
      });
    }
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
