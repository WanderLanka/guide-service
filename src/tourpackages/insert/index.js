const express = require('express');
const slugify = require('slugify');
const TourPackage = require('../../models/TourPackage');
const Guide = require('../../models/Guide');
const validate = require('../../middleware/validate');
const { createPackageSchema } = require('../../validators/tourPackageValidators');

const router = express.Router();

router.post('/', validate(createPackageSchema), async (req, res, next) => {
  try {
    const {
      guideId,
      slug,
      title,
      description,
      details,
      durationDays,
      duration,
      locations,
      tags,
      images,
      coverImage,
      includes,
      excludes,
  highlights,
  requirements,
      pricing,
      itinerary,
      policies,
      maxGroupSize,
      isActive,
    } = req.body;

    // Ensure guide exists and is permitted
    const guide = await Guide.findById(guideId).lean();
    if (!guide) {
      return res.status(404).json({ success: false, error: 'Guide not found' });
    }
    if (guide.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Guide is not active' });
    }

    // Normalize slug
    const normalizedSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(title, { lower: true, strict: true });

    // Ensure slug uniqueness
    const exists = await TourPackage.findOne({ slug: normalizedSlug }).lean();
    if (exists) {
      return res.status(409).json({ success: false, error: 'Package slug already exists' });
    }

    // If duration object provided, compute durationDays equivalent
    let computedDurationDays = durationDays;
    if (duration && typeof duration.value === 'number' && duration.unit) {
      if (duration.unit === 'days') computedDurationDays = duration.value;
      if (duration.unit === 'hours') computedDurationDays = Math.max(1, Math.ceil(duration.value / 24));
      if (duration.unit === 'minutes') computedDurationDays = Math.max(1, Math.ceil(duration.value / (24 * 60)));
    }

    const doc = await TourPackage.create({
      guideId,
      slug: normalizedSlug,
      title,
      description,
      details,
      durationDays: computedDurationDays,
      duration,
      locations,
      tags,
      images,
      coverImage,
      includes,
      excludes,
  highlights,
  requirements,
      maxGroupSize,
      pricing,
      itinerary,
      policies,
      isActive,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
