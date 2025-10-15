const express = require('express');
const mongoose = require('mongoose');
const TourPackage = require('../../models/TourPackage');

const router = express.Router();

// GET /tourpackages/get/:slugOrId
router.get('/:slugOrId', async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const filter = isObjectId ? { _id: slugOrId } : { slug: slugOrId };
    const doc = await TourPackage.findOne(filter).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Tour package not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
