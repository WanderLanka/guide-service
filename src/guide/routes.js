const express = require('express');

const insertGuideRouter = require('./insert');
const listGuidesRouter = require('./list');
const getGuideRouter = require('./get');
const updateGuideRouter = require('./update');
const deleteGuideRouter = require('./delete');

const router = express.Router();

router.use('/insert', insertGuideRouter);
router.use('/list', listGuidesRouter);
router.use('/get', getGuideRouter);
router.use('/update', updateGuideRouter);
router.use('/delete', deleteGuideRouter);

module.exports = router;
