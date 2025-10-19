const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

/**
 * PATCH /guide/:id/response-time
 * Body: { responseTimeMs: number, alpha?: number }
 * Updates metrics.responseTimeMs using an exponential moving average.
 */
router.patch('/guide/:id/response-time', async (req, res, next) => {
  try {
    const { id } = req.params;
    let { responseTimeMs, alpha } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid guide ID' });
    }

    const parsed = Number(responseTimeMs);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res.status(400).json({ success: false, error: 'responseTimeMs must be a non-negative number' });
    }

    // Smoothing factor for EMA; default 0.3 if not provided or invalid
    const smoothing = Number(alpha);
    const emaAlpha = Number.isFinite(smoothing) && smoothing > 0 && smoothing <= 1 ? smoothing : 0.3;

    const guide = await Guide.findById(id).lean();
    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }

    const current = Number(guide?.metrics?.responseTimeMs) || 0;
    const updatedValue = current > 0
      ? Math.round(emaAlpha * parsed + (1 - emaAlpha) * current)
      : Math.round(parsed);

    const updated = await Guide.findByIdAndUpdate(
      id,
      { $set: { 'metrics.responseTimeMs': updatedValue, updatedAt: new Date() } },
      { new: true }
    );

    return res.json({ success: true, data: { guideId: updated._id, responseTimeMs: updated.metrics.responseTimeMs } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


