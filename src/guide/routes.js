const express = require('express');

const insertGuideRouter = require('./insert');
const listGuidesRouter = require('./list');
const getGuideRouter = require('./get');
const updateGuideRouter = require('./update');
const deleteGuideRouter = require('./delete');
const updateBookingCountRouter = require('./updateBookingCount');
const availabilityRouter = require('./availability');

const router = express.Router();

router.use('/insert', insertGuideRouter);
router.use('/list', listGuidesRouter);
router.use('/get', getGuideRouter);
router.use('/update', updateGuideRouter);
router.use('/delete', deleteGuideRouter);

// Booking count update (called by booking-service)
router.use('/', updateBookingCountRouter);

// Guide availability (returns available/unavailable dates)
router.use('/', availabilityRouter);

module.exports = router;
