const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
    bannerUrl: {
        type: String
    },
    type: {
        type: String,
        default: 'Promotion'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'events' // 👈 사용자 요청에 따라 'events' 컬렉션 사용
});

module.exports = mongoose.model('Promotion', promotionSchema);
