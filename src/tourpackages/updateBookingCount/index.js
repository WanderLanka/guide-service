const express = require('express');
const mongoose = require('mongoose');
const TourPackage = require('../../models/TourPackage');

const router = express.Router();

/**
 * PATCH /tourpackages/:id/booking-count
 * Update the booking count for a tour package
 */
router.patch('/:id/booking-count', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { increment = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid package ID' 
      });
    }

    const incrementNum = parseInt(increment);
    if (isNaN(incrementNum)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Increment must be a number' 
      });
    }

    const updated = await TourPackage.findByIdAndUpdate(
      id,
      { 
        $inc: { bookingCount: incrementNum },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tour package not found' 
      });
    }

    console.log(`Updated booking count for package ${id}: ${incrementNum > 0 ? '+' : ''}${incrementNum} (total: ${updated.bookingCount})`);

    return res.json({ 
      success: true, 
      data: {
        packageId: updated._id,
        bookingCount: updated.bookingCount,
        increment: incrementNum,
      },
    });
  } catch (err) {
    console.error('Update booking count error:', err);
    next(err);
  }
});

module.exports = router;
