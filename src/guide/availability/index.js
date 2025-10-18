const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');
const TourPackageBooking = require('../../models/TourPackageBooking');

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

    // Check for confirmed and approved bookings in this date range
    const confirmedBookings = await TourPackageBooking.find({
      guideId: id,
      status: { $in: ['approved', 'confirmed'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    }).select('startDate endDate status').lean();

    // Generate list of unavailable dates from bookings
    const unavailableDates = [];
    confirmedBookings.forEach(booking => {
      const current = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      while (current <= bookingEnd) {
        unavailableDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    // Also include dates explicitly blocked in Guide.availability (slots empty means fully blocked)
    if (Array.isArray(guide.availability) && guide.availability.length > 0) {
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      for (const entry of guide.availability) {
        try {
          const d = new Date(entry.date);
          const dayOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          if (dayOnly >= startDay && dayOnly <= endDay) {
            const isBlocked = !entry.slots || (Array.isArray(entry.slots) && entry.slots.length === 0);
            if (isBlocked) {
              unavailableDates.push(dayOnly.toISOString().split('T')[0]);
            }
          }
        } catch {}
      }
    }

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

// POST /guide/:id/availability/block
// Block a guide for a continuous date range (inclusive)
router.post('/:id/availability/block', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid guide ID' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date values' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, error: 'endDate must be after startDate' });
    }

    const guide = await Guide.findById(id);
    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }

    // Build set of existing blocked days to avoid duplicates
    const blockedSet = new Set(
      (guide.availability || [])
        .filter(e => !e.slots || (Array.isArray(e.slots) && e.slots.length === 0))
        .map(e => {
          const d = new Date(e.date);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        })
    );

    // Add each day in the range as blocked (slots: []) if not already present
    const toAdd = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endDay) {
      const isoDay = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()).toISOString();
      if (!blockedSet.has(isoDay)) {
        toAdd.push({ date: new Date(isoDay), slots: [] });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (toAdd.length > 0) {
      guide.availability = Array.isArray(guide.availability)
        ? guide.availability.concat(toAdd)
        : toAdd;
      await guide.save();
    }

    return res.json({ success: true, data: { guideId: id, added: toAdd.length } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
