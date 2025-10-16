const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'USD' },
    amount: { type: Number, required: true, min: 0 },
    // Optional tiered pricing per person
    perPerson: { type: Boolean, default: false },
  },
  { _id: false }
);

const ItineraryItemSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const PoliciesSchema = new mongoose.Schema(
  {
    meetingPoint: { type: String },
    text: { type: String },
    freeCancellation: { type: Boolean, default: false },
    freeCancellationWindow: {
      type: String,
      enum: ['anytime', '1_day_before', '7_days_before', '14_days_before'],
    },
  },
  { _id: false }
);

const TourPackageSchema = new mongoose.Schema(
  {
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true, index: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    details: { type: String }, // additional optional details
    durationDays: { type: Number, required: true, min: 1 },
    // Preserve an exact duration representation (UI can be hours/minutes)
    duration: {
      value: { type: Number, min: 1 },
      unit: { type: String, enum: ['days', 'hours', 'minutes'] },
    },
    locations: [String],
    tags: [String],
    images: [String],
    coverImage: { type: String },
    includes: [String],
    excludes: [String],
  // Additional package details
  highlights: [String],
  requirements: [String],
    // Store maximum allowed group size for the package
    maxGroupSize: { type: Number, min: 1 },
    pricing: PricingSchema,
    itinerary: {
      type: [ItineraryItemSchema],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: 'Itinerary must contain at least one item',
      },
    },
    policies: PoliciesSchema,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'tour_packages' }
);

module.exports = mongoose.model('TourPackage', TourPackageSchema);
