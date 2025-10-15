const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    username: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'pending', 'rejected', 'inactive'], default: 'pending', index: true },
    featured: { type: Boolean, default: false, index: true },
    details: {
      firstName: String,
      lastName: String,
      bio: String,
      languages: [String],
      avatar: String,
    },
    availability: [
      {
        date: { type: Date, required: true },
        slots: [{ start: String, end: String }],
      },
    ],
    metrics: {
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      responseTimeMs: { type: Number, default: 0 },
    },
  },
  { timestamps: true, collection: 'guides' }
);

module.exports = mongoose.model('Guide', GuideSchema);
