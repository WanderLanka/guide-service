const express = require('express');
const mongoose = require('mongoose');
const slugify = require('slugify');
const Joi = require('joi');
const validate = require('../../middleware/validate');
const TourPackage = require('../../models/TourPackage');

const updateSchema = Joi.object({
  slug: Joi.string().min(3).max(100).optional(),
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().allow('', null).optional(),
  details: Joi.string().allow('', null).optional(),
  durationDays: Joi.number().integer().min(1).optional(),
  duration: Joi.object({
    value: Joi.number().integer().min(1).required(),
    unit: Joi.string().valid('days', 'hours', 'minutes').required(),
  }).optional(),
  locations: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  coverImage: Joi.string().uri().allow('', null).optional(),
  maxGroupSize: Joi.number().integer().min(1).optional(),
  includes: Joi.array().items(Joi.string()).optional(),
  excludes: Joi.array().items(Joi.string()).optional(),
  highlights: Joi.array().items(Joi.string()).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  pricing: Joi.object({
    currency: Joi.string().optional(),
    amount: Joi.number().min(0).optional(),
    perPerson: Joi.boolean().optional(),
  }).optional(),
  itinerary: Joi.array().items(
    Joi.object({
      day: Joi.number().integer().min(1).required(),
      title: Joi.string().required(),
      description: Joi.string().allow('', null),
    })
  ).optional(),
  policies: Joi.object({
    meetingPoint: Joi.string().allow('', null).optional(),
    text: Joi.string().allow('', null).optional(),
    freeCancellation: Joi.boolean().optional(),
    freeCancellationWindow: Joi.string().valid('anytime', '1_day_before', '7_days_before', '14_days_before').allow(null).optional(),
  }).optional(),
  isActive: Joi.boolean().optional(),
});

const router = express.Router();

// PATCH /tourpackages/update/:slugOrId
router.patch('/:slugOrId', validate(updateSchema), async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const updates = { ...req.body };

    // If duration object provided, compute durationDays equivalent and persist duration
    if (updates.duration && typeof updates.duration.value === 'number' && updates.duration.unit) {
      let computed = updates.durationDays;
      if (updates.duration.unit === 'days') computed = updates.duration.value;
      if (updates.duration.unit === 'hours') computed = Math.max(1, Math.ceil(updates.duration.value / 24));
      if (updates.duration.unit === 'minutes') computed = Math.max(1, Math.ceil(updates.duration.value / (24 * 60)));
      updates.durationDays = computed;
    }

    // Normalize slug if provided and ensure uniqueness
    if (updates.slug) {
      updates.slug = slugify(updates.slug, { lower: true, strict: true });
      const exists = await TourPackage.findOne({ slug: updates.slug }).lean();
      if (exists && String(exists._id) !== slugOrId) {
        return res.status(409).json({ success: false, error: 'Package slug already exists' });
      }
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const filter = isObjectId ? { _id: slugOrId } : { slug: slugOrId };

    const doc = await TourPackage.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Tour package not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
