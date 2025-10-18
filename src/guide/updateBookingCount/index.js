const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

/**
 * PATCH /guide/:id/booking-count
 * Update the total bookings metric for a guide
 */
router.patch('/:id/booking-count', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { increment = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid guide ID' 
      });
    }

    const incrementNum = parseInt(increment);
    if (isNaN(incrementNum)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Increment must be a number' 
      });
    }

    const updated = await Guide.findByIdAndUpdate(
      id,
      { 
        $inc: { 'metrics.totalBookings': incrementNum },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'Guide not found' 
      });
    }

    console.log(`Updated booking count for guide ${id}: ${incrementNum > 0 ? '+' : ''}${incrementNum} (total: ${updated.metrics.totalBookings})`);

    return res.json({ 
      success: true, 
      data: {
        guideId: updated._id,
        totalBookings: updated.metrics.totalBookings,
        increment: incrementNum,
      },
    });
  } catch (err) {
    console.error('Update guide booking count error:', err);
    next(err);
  }
});

module.exports = router;
