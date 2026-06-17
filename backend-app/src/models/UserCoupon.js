const mongoose = require('mongoose');

/**
 * 🎫 [UserCoupon] 사용자가 획득한 비공개 쿠폰 보관함
 */
const userCouponSchema = new mongoose.Schema({
  userId: { 
    type: String, // MySQL 유저 ID
    required: true,
    index: true
  },
  couponId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coupon',
    required: true 
  },
  isUsed: { 
    type: Boolean, 
    default: false 
  },
  issuedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date 
  }
}, { 
  timestamps: true,
  collection: 'usercoupons' 
});

module.exports = mongoose.model('UserCoupon', userCouponSchema);
