const Joi = require('joi');

const createPackageSchema = Joi.object({
  guideId: Joi.string().required(),
  slug: Joi.string().min(3).max(100).required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().allow('', null),
  details: Joi.string().allow('', null),
  durationDays: Joi.number().integer().min(1).required(),
  duration: Joi.object({
    value: Joi.number().integer().min(1).required(),
    unit: Joi.string().valid('days', 'hours', 'minutes').required(),
  }).optional(),
  locations: Joi.array().items(Joi.string()).default([]),
  tags: Joi.array().items(Joi.string()).default([]),
  images: Joi.array().items(Joi.string().uri()).default([]),
  coverImage: Joi.string().uri().allow('', null),
  maxGroupSize: Joi.number().integer().min(1).optional(),
  includes: Joi.array().items(Joi.string()).default([]),
  excludes: Joi.array().items(Joi.string()).default([]),
  highlights: Joi.array().items(Joi.string()).default([]),
  requirements: Joi.array().items(Joi.string()).default([]),
  pricing: Joi.object({
    currency: Joi.string().default('USD'),
    amount: Joi.number().min(0).required(),
    perPerson: Joi.boolean().default(false),
  }).required(),
  itinerary: Joi.array().min(1).items(
    Joi.object({
      day: Joi.number().integer().min(1).required(),
      title: Joi.string().required(),
      description: Joi.string().allow('', null),
    })
  ).required(),
  policies: Joi.object({
    meetingPoint: Joi.string().allow('', null),
    text: Joi.string().allow('', null),
    freeCancellation: Joi.boolean().default(false),
    freeCancellationWindow: Joi.string().valid('anytime', '1_day_before', '7_days_before', '14_days_before').allow(null),
  }).default({}),
  isActive: Joi.boolean().default(true),
});

module.exports = { createPackageSchema };
