const express = require('express');
const TourPackage = require('../../models/TourPackage');
const validate = require('../../middleware/validate');
const Joi = require('joi');

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  q: Joi.string().allow('', null),
  guideId: Joi.string().allow('', null),
  isActive: Joi.boolean().optional(),
  tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
});

const router = express.Router();

router.get('/', validate(listQuery, 'query'), async (req, res, next) => {
  try {
    const { page, limit, q, guideId, isActive, tags } = req.query;
    const filter = {};
    if (guideId) filter.guideId = guideId;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { locations: { $elemMatch: { $regex: q, $options: 'i' } } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
      ];
    }
    if (tags) {
      const arr = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $all: arr };
    }

    const skip = (page - 1) * limit;

    const projection = {
      slug: 1,
      title: 1,
      durationDays: 1,
      duration: 1,
      locations: 1,
      tags: 1,
      images: { $slice: 1 },
      coverImage: 1,
      maxGroupSize: 1,
      highlights: { $slice: 3 },
      pricing: 1,
      isActive: 1,
      guideId: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      TourPackage.find(filter, projection).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      TourPackage.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
