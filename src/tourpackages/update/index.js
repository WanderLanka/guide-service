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
  durationDays: Joi.number().integer().min(1).optional(),
  locations: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  includes: Joi.array().items(Joi.string()).optional(),
  excludes: Joi.array().items(Joi.string()).optional(),
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
  isActive: Joi.boolean().optional(),
});

const router = express.Router();

// PATCH /tourpackages/update/:slugOrId
router.patch('/:slugOrId', validate(updateSchema), async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const updates = { ...req.body };

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
