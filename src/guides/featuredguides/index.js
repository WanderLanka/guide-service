const express = require('express');
const Guide = require('../../models/Guide');

const router = express.Router();

// GET /guides/featuredguides?limit=&status=
router.get('/', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const status = req.query.status || 'active';

    const baseFilter = { status };

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

    let items = await Guide.find({ ...baseFilter, featured: true }, projection)
      .sort({ 'metrics.rating': -1, 'details.firstName': 1 })
      .limit(limit)
      .lean();

    if (!items || items.length < Math.min(3, limit)) {
      const remaining = limit - (items ? items.length : 0);
      const fallback = await Guide.find(baseFilter, projection)
        .sort({ 'metrics.rating': -1, 'details.firstName': 1 })
        .limit(remaining > 0 ? remaining : 0)
        .lean();
      items = [...(items || []), ...fallback];
    }

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
