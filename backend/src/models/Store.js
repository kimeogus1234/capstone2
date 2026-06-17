const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    categories: {
        type: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category'
        }],
        validate: {
            validator: function(v) {
                // type이 'STORE'일 때만 최소 한 개 이상의 카테고리가 필요함
                if (this.type === 'STORE') {
                    return v && v.length > 0;
                }
                return true;
            },
            message: '일반 매장(STORE)은 최소 하나 이상의 카테고리를 선택해야 합니다.'
        }
    },
    floor: { 
        type: String, 
        required: true
    },
    markerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MapMarker',
        default: null
    },
    locationCode: { type: String, required: true }, // e.g., "2055"
    description: { type: String },
    hours: { type: String, default: "10:00 - 22:00" },
    tags: [{ type: String }],
    imageUrl: { type: String },
    phone: { type: String },
    isPopular: { type: Boolean, default: false },
    type: { type: String, enum: ['STORE', 'RESTAURANT'], default: 'STORE' },
    mapX: { type: Number },
    mapY: { type: Number },
}, { timestamps: true });

storeSchema.index({ name: 'text', locationCode: 1 });
storeSchema.index({ floor: 1, type: 1 });

module.exports = mongoose.model('Store', storeSchema);
