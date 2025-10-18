const express = require('express');
const Guide = require('../models/Guide');

const router = express.Router();

/**
 * Calculate featured score for a guide based on multiple factors
 * Higher score = more featured
 */
function calculateFeaturedScore(guide) {
  const {
    rating = 0,
    totalReviews = 0,
    totalBookings = 0,
    responseTimeMs = 0,
  } = guide.metrics || {};

  // Weighted scoring algorithm
  const ratingScore = rating * 20; // Max 100 points (5 * 20)
  const reviewScore = Math.min(totalReviews * 2, 50); // Max 50 points
  const bookingScore = Math.min(totalBookings * 3, 50); // Max 50 points
  const responseScore = responseTimeMs > 0 
    ? Math.max(0, 30 - (responseTimeMs / 1000 / 60 / 60)) // Penalty for slow response
    : 0;

  // Bonus for featured flag
  const featuredBonus = guide.featured ? 50 : 0;

  return ratingScore + reviewScore + bookingScore + responseScore + featuredBonus;
}

/**
 * GET /featuredguides
 * Query params:
 * - limit: number of guides to return (default: 10)
 * - status: guide status filter (default: 'active')
 * - q: search query (searches firstName, lastName, bio, languages)
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const status = req.query.status || 'active';
    const searchQuery = req.query.q ? String(req.query.q).trim() : '';

    const baseFilter = { status };

    // Add search filter if query provided
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, 'i');
      baseFilter.$or = [
        { 'details.firstName': searchRegex },
        { 'details.lastName': searchRegex },
        { 'details.bio': searchRegex },
        { 'details.languages': { $in: [searchRegex] } },
        { username: searchRegex },
      ];
    }

    const projection = {
      username: 1,
      status: 1,
      featured: 1,
      'details.firstName': 1,
      'details.lastName': 1,
      'details.avatar': 1,
      'details.bio': 1,
      'details.languages': 1,
      'metrics.rating': 1,
      'metrics.totalReviews': 1,
      'metrics.totalBookings': 1,
      'metrics.responseTimeMs': 1,
    };

    // Fetch all matching guides and calculate scores
    let guides = await Guide.find(baseFilter, projection).lean();

    // Calculate featured score for each guide
    guides = guides.map(guide => ({
      ...guide,
      _featuredScore: calculateFeaturedScore(guide),
    }));

    // Sort by featured score (highest first)
    guides.sort((a, b) => b._featuredScore - a._featuredScore);

    // Limit results
    const items = guides.slice(0, limit);

    // Remove internal score field before sending
    const cleanedItems = items.map(({ _featuredScore, ...guide }) => guide);

    res.json({ 
      success: true, 
      data: cleanedItems,
      total: guides.length,
      limit: limit,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
