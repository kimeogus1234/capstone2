const mongoose = require('mongoose');

/**
 * 🎁 [Conditional Reward] 비공개 쿠폰 지급 조건 정의 모델
 */
const conditionalRewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  
  condition: {
    type: { 
      type: String, 
      enum: ['STORE_TOTAL', 'ORDER_TOTAL', 'CATEGORY_TOTAL', 'TOTAL_AMOUNT'], 
      required: true 
    },
    target_id: { type: mongoose.Schema.Types.Mixed }, // Store ID, Category ID, etc.
    min_amount: { type: Number, default: 0 } // 조건 충족을 위한 최소 금액
  },

  reward: {
    coupon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    message: { type: String, default: "쿠폰이 지급되었습니다!" }
  },

  is_active: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }
}, { 
  timestamps: true,
  collection: 'couponrules' // 👈 사용자님의 컬렉션 이름과 일치시킴
});

module.exports = mongoose.model('ConditionalReward', conditionalRewardSchema);
