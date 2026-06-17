const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    floor: { 
        type: String, 
        required: true
    },
    markerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MapMarker',
        default: null
    },
    locationCode: { type: String, required: true },
    description: { type: String },
    hours: { type: String, default: "11:00 - 21:00" },
    phone: { type: String },
    imageUrl: { type: String },
    mapX: { type: Number },
    mapY: { type: Number },
    isPopular: { type: Boolean, default: false },
    cuisineType: { type: String } // e.g., "한식", "중식", "일식"
}, { timestamps: true });

restaurantSchema.index({ name: 'text', floor: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
