const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    guideId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Guide', 
      required: true, 
      index: true 
    },
    travelerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      index: true 
    },
    travelerName: { 
      type: String, 
      required: true 
    },
    travelerEmail: { 
      type: String, 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5, 
      index: true 
    },
    comment: { 
      type: String, 
      required: true, 
      maxlength: 1000 
    },
    bookingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TourPackageBooking',
      index: true 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    helpfulCount: { 
      type: Number, 
      default: 0 
    },
    images: [{
      url: String,
      thumbnailUrl: String,
      caption: String
    }],
    response: {
      comment: String,
      respondedAt: Date,
      respondedBy: mongoose.Schema.Types.ObjectId
    },
    status: { 
      type: String, 
      enum: ['active', 'hidden', 'flagged'], 
      default: 'active' 
    }
  },
  { 
    timestamps: true, 
    collection: 'reviews' 
  }
);

// Indexes for efficient queries
ReviewSchema.index({ guideId: 1, createdAt: -1 });
ReviewSchema.index({ travelerId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });

// Ensure one review per traveler per guide
ReviewSchema.index({ guideId: 1, travelerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
