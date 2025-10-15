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

const TourPackageSchema = new mongoose.Schema(
  {
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true, index: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    durationDays: { type: Number, required: true, min: 1 },
    locations: [String],
    tags: [String],
    images: [String],
    includes: [String],
    excludes: [String],
    pricing: PricingSchema,
    itinerary: [ItineraryItemSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'tour_packages' }
);

module.exports = mongoose.model('TourPackage', TourPackageSchema);
