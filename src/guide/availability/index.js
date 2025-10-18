const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

// GET /guide/:id/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns available and unavailable dates for the guide
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid guide ID' });
    }

    const guide = await Guide.findById(id);
    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days ahead

    // Check for confirmed bookings in this date range
    const TourPackageBooking = mongoose.model('TourPackageBooking');
    const confirmedBookings = await TourPackageBooking.find({
      guideId: id,
      status: 'confirmed',
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    }).select('startDate endDate').lean();

    // Generate list of unavailable dates
    const unavailableDates = [];
    confirmedBookings.forEach(booking => {
      const current = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      while (current <= bookingEnd) {
        unavailableDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    // Generate list of all dates in range
    const allDates = [];
    const current = new Date(start);
    while (current <= end) {
      allDates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Determine available dates
    const unavailableSet = new Set(unavailableDates);
    const availableDates = allDates.filter(date => !unavailableSet.has(date));

    res.json({
      success: true,
      data: {
        guideId: id,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        availableDates,
        unavailableDates: Array.from(unavailableSet),
        confirmedBookings: confirmedBookings.length
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
