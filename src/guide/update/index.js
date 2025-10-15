const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

// PATCH/PUT /guide/update/:idOrUsername
async function handleUpdate(req, res, next) {
  try {
    const { idOrUsername } = req.params;
    const { userId } = req.query || {};
    const { status, details, featured } = req.body || {};

    const update = {};
    if (typeof status !== 'undefined') update.status = status;
    if (typeof featured !== 'undefined') update.featured = !!featured;
    if (details && typeof details === 'object') update.details = details;

    let query = null;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      query = { userId };
    } else if (idOrUsername) {
      query = mongoose.Types.ObjectId.isValid(idOrUsername)
        ? { _id: idOrUsername }
        : { username: idOrUsername };
    }
    if (!query) {
      return res.status(400).json({ success: false, error: 'Provide userId or id/username' });
    }

    const guide = await Guide.findOneAndUpdate(query, { $set: update }, { new: true }).lean();
    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }
    return res.json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
}

router.patch('/:idOrUsername', handleUpdate);
router.put('/:idOrUsername', handleUpdate);

module.exports = router;
