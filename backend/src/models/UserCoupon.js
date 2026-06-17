const mongoose = require('mongoose');

const userCouponSchema = new mongoose.Schema({
    user_id: {
        type: Number, // MySQL User ID
        required: true,
        index: true
    },
    coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    is_used: {
        type: Boolean,
        default: false
    },
    used_at: {
        type: Date,
        default: null
    },
    issued_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 동일한 유저가 동일한 쿠폰을 중복해서 받지 못하게 하려면 인덱스 설정 가능 (선택 사항)
// userCouponSchema.index({ user_id: 1, coupon_id: 1 }, { unique: true });

module.exports = mongoose.model('UserCoupon', userCouponSchema);
