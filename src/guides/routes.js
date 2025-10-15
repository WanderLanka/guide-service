const express = require('express');
const featuredGuidesRouter = require('./featuredguides');

const router = express.Router();

router.use('/featuredguides', featuredGuidesRouter);

module.exports = router;
