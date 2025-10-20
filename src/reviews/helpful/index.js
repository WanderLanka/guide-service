const express = require('express');
const mongoose = require('mongoose');
const Review = require('../../models/Review');
const { verifyToken } = require('../../middleware/auth');

const router = express.Router();

// POST /reviews/helpful/:reviewId
router.post('/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { action = 'add' } = req.body; // 'add' or 'remove'

    // Validation
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid review ID' 
      });
    }

    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Action must be "add" or "remove"' 
      });
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        error: 'Review not found' 
      });
    }

    // Update helpful count
    const increment = action === 'add' ? 1 : -1;
    const newHelpfulCount = Math.max(0, review.helpfulCount + increment);

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { helpfulCount: newHelpfulCount } },
      { new: true }
    ).populate('guideId', 'username details.firstName details.lastName details.avatar');

    res.json({
      success: true,
      data: updatedReview,
      message: `Review ${action === 'add' ? 'marked as' : 'unmarked from'} helpful`
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
