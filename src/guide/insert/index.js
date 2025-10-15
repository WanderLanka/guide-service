const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

// POST /guide/insert (idempotent upsert by userId)
router.post('/', async (req, res, next) => {
  try {
    const { userId, username, status, details, featured } = req.body || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing userId' });
    }
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid or missing username' });
    }

    const allowedStatuses = ['active', 'pending', 'rejected', 'inactive'];
    const normalizedStatus = allowedStatuses.includes(status) ? status : 'pending';

    const update = { userId, username, status: normalizedStatus };
    if (details && typeof details === 'object') update.details = details;
    if (typeof featured !== 'undefined') update.featured = !!featured;

    const doc = await Guide.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }
    next(err);
  }
});

module.exports = router;
