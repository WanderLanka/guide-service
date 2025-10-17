const express = require('express');

const insertPackageRouter = require('./insert');
const listPackagesRouter = require('./list');
const getPackageRouter = require('./get');
const updatePackageRouter = require('./update');
const deletePackageRouter = require('./delete');
const updateBookingCountRouter = require('./updateBookingCount');

const router = express.Router();

// Primary routes
router.use('/insert', insertPackageRouter);
router.use('/list', listPackagesRouter);
router.use('/get', getPackageRouter);
router.use('/update', updatePackageRouter);
router.use('/delete', deletePackageRouter);

// Booking count update (called by booking-service)
router.use('/', updateBookingCountRouter);

// Backwards compatibility alias
router.use('/createpackage', insertPackageRouter);

module.exports = router;
