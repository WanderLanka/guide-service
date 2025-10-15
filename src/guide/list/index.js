const express = require('express');
const Guide = require('../../models/Guide');

const router = express.Router();

// GET /guide/list?status=&featured=&limit=&q=
router.get('/', async (req, res, next) => {
  try {
    const { status, featured, q, userId } = req.query;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 50;

    const filter = {};
    if (status) filter.status = status;
    if (typeof featured !== 'undefined') filter.featured = String(featured).toLowerCase() === 'true';
    if (userId) {
      const ids = Array.isArray(userId) ? userId : [userId];
      filter.userId = { $in: ids };
    }
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { 'details.firstName': { $regex: q, $options: 'i' } },
        { 'details.lastName': { $regex: q, $options: 'i' } },
      ];
    }

    const projection = {
      username: 1,
      status: 1,
      featured: 1,
      'details.firstName': 1,
      'details.lastName': 1,
      'details.avatar': 1,
      'metrics.rating': 1,
      'metrics.totalReviews': 1,
    };

    const items = await Guide.find(filter, projection)
      .sort({ featured: -1, 'metrics.rating': -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
