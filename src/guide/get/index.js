const express = require('express');
const mongoose = require('mongoose');
const Guide = require('../../models/Guide');

const router = express.Router();

// GET /guide/get/:idOrUsername? OR /guide/get?userId=
router.get('/:idOrUsername?', async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    const { userId } = req.query || {};

    let guide = null;
    if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
      guide = await Guide.findOne({ userId }).lean();
    } else if (idOrUsername) {
      if (mongoose.Types.ObjectId.isValid(idOrUsername)) {
        guide = await Guide.findById(idOrUsername).lean();
      } else {
        guide = await Guide.findOne({ username: idOrUsername }).lean();
      }
    }

    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }
    return res.json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
