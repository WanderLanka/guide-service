const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const validate = require('../../middleware/validate');
const TourPackage = require('../../models/TourPackage');

const deleteQuery = Joi.object({ hard: Joi.boolean().default(false) });

const router = express.Router();

// DELETE /tourpackages/delete/:slugOrId?hard=true
router.delete('/:slugOrId', validate(deleteQuery, 'query'), async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const { hard } = req.query;
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const filter = isObjectId ? { _id: slugOrId } : { slug: slugOrId };

    let result;
    if (hard) {
      result = await TourPackage.findOneAndDelete(filter).lean();
    } else {
      result = await TourPackage.findOneAndUpdate(filter, { $set: { isActive: false } }, { new: true }).lean();
    }
    if (!result) return res.status(404).json({ success: false, error: 'Tour package not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
