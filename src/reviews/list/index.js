const express = require('express');
const mongoose = require('mongoose');
const Review = require('../../models/Review');

const router = express.Router();

// GET /reviews/list?guideId=&travelerId=&page=&limit=&sort=
router.get('/', async (req, res, next) => {
  try {
    const { 
      guideId, 
      travelerId, 
      page = 1, 
      limit = 10, 
      sort = 'recent',
      status = 'active'
    } = req.query;

    // Build filter
    const filter = { status };
    
    if (guideId && mongoose.Types.ObjectId.isValid(guideId)) {
      filter.guideId = guideId;
    }
    
    if (travelerId && mongoose.Types.ObjectId.isValid(travelerId)) {
      filter.travelerId = travelerId;
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'recent':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'rating_high':
        sortQuery = { rating: -1, createdAt: -1 };
        break;
      case 'rating_low':
        sortQuery = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortQuery = { helpfulCount: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [reviews, totalCount] = await Promise.all([
      Review.find(filter)
        .populate('guideId', 'username details.firstName details.lastName details.avatar')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Calculate average rating and distribution for the guide (if guideId is specified)
    let averageRating = 0;
    let totalReviews = 0;
    let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    if (guideId && mongoose.Types.ObjectId.isValid(guideId)) {
      const ratingStats = await Review.aggregate([
        { $match: { guideId: new mongoose.Types.ObjectId(guideId), status: 'active' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (ratingStats.length > 0) {
        averageRating = Math.round(ratingStats[0].averageRating * 10) / 10;
        totalReviews = ratingStats[0].totalReviews;
        
        // Calculate rating distribution
        const ratings = ratingStats[0].ratingDistribution || [];
        ratingDistribution = ratings.reduce((acc, rating) => {
          const roundedRating = Math.round(rating);
          if (roundedRating >= 1 && roundedRating <= 5) {
            acc[roundedRating] = (acc[roundedRating] || 0) + 1;
          }
          return acc;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      }
    }

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        stats: {
          averageRating,
          totalReviews,
          ratingDistribution
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
