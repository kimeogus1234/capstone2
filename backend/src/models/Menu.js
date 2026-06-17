const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    category: { type: String, default: '일반' }, // 예: 메인, 디저트, 음료
    isAvailable: { type: Boolean, default: true },
    recommend: { type: Boolean, default: false }, // 추천 메뉴 여부
    spicyLevel: { type: Number, default: 0 } // 맵기 정도 (0~3)
}, {
    timestamps: true
});

module.exports = mongoose.model('Menu', menuSchema);
