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
      locations,
      tags,
      images,
      coverImage,
      includes,
      excludes,
      pricing,
      itinerary,
      policies,
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

    const doc = await TourPackage.create({
      guideId,
      slug: normalizedSlug,
      title,
      description,
      details,
      durationDays,
      locations,
      tags,
      images,
      coverImage,
      includes,
      excludes,
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
