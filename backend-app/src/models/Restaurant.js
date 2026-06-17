const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    floor: { 
        type: String, 
        required: true, 
        enum: ['B3', 'B2', 'B1', '1F', '2F', '3F', '4F', '5F', '6F', '7F'] 
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
}, { 
    timestamps: true,
    collection: 'restaurants' // 👈 컬렉션 이름을 명시적으로 지정
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
