const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discount_type: {
        type: String,
        enum: ['PERCENT', 'AMOUNT'],
        default: 'AMOUNT'
    },
    discount_value: {
        type: Number,
        required: true
    },
    // --- 적용 범위 관련 필드 ---
    scope: {
        type: String,
        enum: ['ALL', 'STORE', 'CATEGORY', 'PRODUCT'],
        default: 'ALL'
    },
    // 대상 ID들 (Store ID, Category ID, 또는 Product ID)
    applicable_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        default: []
    }],
    // --- 소유권 관련 필드 ---
    created_by: {
        type: Number, // MySQL User ID
        default: 1
    },
    owner_store_id: {
        type: String, // Store ID (assignedStoreId)
        default: null
    },
    min_order_amount: {
        type: Number,
        default: 0
    },
    max_discount_amount: {
        type: Number,
        default: null
    },
    valid_from: {
        type: Date,
        required: true
    },
    valid_until: {
        type: Date,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_public: {
        type: Boolean,
        default: false // 기본적으로는 비공개 (조건 충족 시 발급)
    }
}, {
    timestamps: true,
    collection: 'coupons'
});

module.exports = mongoose.model('Coupon', couponSchema);
