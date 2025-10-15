const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

// DELETE /guide/delete/:idOrUsername?hard=true
router.delete('/:idOrUsername?', async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const { userId } = req.query || {};
    const hard = String(req.query.hard || '').toLowerCase() === 'true';

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

    const existing = await Guide.findOne(query);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }

    if (hard) {
      await Guide.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { deleted: true, _id: existing._id } });
    }

    existing.status = 'inactive';
    await existing.save();
    return res.json({ success: true, data: existing });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
