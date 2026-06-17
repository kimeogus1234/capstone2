const mongoose = require('mongoose');

const couponRuleSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    
    // 조건 (Trigger)
    condition: {
        type: { 
            type: String, 
            enum: ['STORE_TOTAL', 'CATEGORY_TOTAL', 'TOTAL_AMOUNT'],
            required: true 
        },
        target_id: { 
            type: String,
            default: null 
        }, // Store ID 또는 Category ID
        min_amount: { 
            type: Number, 
            required: true 
        } // 조건 만족을 위한 최소 금액
    },
    
    // 혜택 (Reward)
    reward: {
        coupon_id: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Coupon',
            required: true
        },
        message: { 
            type: String, 
            required: true 
        } // 앱 장바구니에 띄울 안내 문구 (예: "3,000원 더 구매 시 카페 쿠폰 증정!")
    },
    
    is_active: { 
        type: Boolean, 
        default: true 
    },
    priority: { 
        type: Number, 
        default: 0 
    },
    
    // 생성자 정보
    created_by: {
        type: Number, // MySQL User ID
        required: true
    },
    owner_store_id: {
        type: String, // Store ID (assignedStoreId) - 매장 계정이 등록한 경우
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CouponRule', couponRuleSchema);
