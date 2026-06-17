const Promotion = require('../models/Promotion');
const CouponRule = require('../models/ConditionalReward'); // Maps to couponrules collection
const UserCoupon = require('../models/UserCoupon');
const { resolveAuthUserId } = require('../utils/authUser');

// Get all active promotions
exports.getPromotions = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ order: 1, startDate: -1 });
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new promotion (for admin/testing)
exports.createPromotion = async (req, res) => {
    try {
        const promotion = new Promotion(req.body);
        const savedPromotion = await promotion.save();
        res.status(201).json(savedPromotion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a promotion
exports.updatePromotion = async (req, res) => {
    try {
        const updatedPromotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPromotion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a promotion
exports.deletePromotion = async (req, res) => {
    try {
        await Promotion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Promotion deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 📈 [게이미피케이션] 실시간 장바구니 퀘스트 추천 가이드 연동 API (멀티티어 금액 구간별 게이지 연동)
exports.checkEligibility = async (req, res) => {
    try {
        const { items } = req.body; // [{ productId, storeId, categoryId, price, quantity }]

        // 1. 전체 장바구니 총액 계산
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const suggestions = [];

        let usedCouponSet = new Set();
        if (req.user?.id) {
            const userId = resolveAuthUserId(req);
            const usedCouponIds = await UserCoupon.find({ userId, isUsed: true }).distinct('couponId');
            usedCouponSet = new Set(usedCouponIds.map(id => id.toString()));
        }

        // 🌟 활성화된 공개 금액별(ALL) 쿠폰 로드 (이미 사용한 쿠폰 제외)
        const Coupon = require('../models/Coupon');
        const now = new Date();
        const activeAllCoupons = await Coupon.find({
            is_active: true,
            is_public: true,
            scope: 'ALL',
            min_order_amount: { $gt: 0 },
            valid_from: { $lte: now },
            valid_until: { $gte: now }
        });

        const availableCoupons = activeAllCoupons.filter(c => !usedCouponSet.has(c._id.toString()));

        if (availableCoupons.length > 0) {
            // 최소금액 오름차순 정렬 (예: 3만, 5만, 10만...)
            availableCoupons.sort((a, b) => a.min_order_amount - b.min_order_amount);

            // 달성한 쿠폰들과 아직 달성하지 못한 다음 쿠폰 분류
            const metCoupons = availableCoupons.filter(c => totalAmount >= c.min_order_amount);
            const upcomingCoupon = availableCoupons.find(c => totalAmount < c.min_order_amount);

            // 가장 최근에 달성한(가장 금액이 큰) 쿠폰
            const highestMet = metCoupons.length > 0 ? metCoupons[metCoupons.length - 1] : null;

            if (upcomingCoupon) {
                const minAmount = upcomingCoupon.min_order_amount;
                const remaining = minAmount - totalAmount;
                const progress = minAmount > 0 ? Math.min(Math.round((totalAmount / minAmount) * 100), 100) : 100;

                let achievedMessage = null;
                if (highestMet) {
                    achievedMessage = `🎉 현재 ${highestMet.discount_value.toLocaleString()}원 할인 가능! 🎁`;
                }

                suggestions.push({
                    rule_id: upcomingCoupon._id,
                    title: upcomingCoupon.name,
                    message: `🛒 ${minAmount.toLocaleString()}원 이상 구매 시 ${upcomingCoupon.discount_value.toLocaleString()}원 할인`,
                    achieved_message: achievedMessage, // 이전 달성 혜택 메시지
                    is_achieved: false,
                    remaining_amount: remaining > 0 ? remaining : 0,
                    progress: progress,
                    discount_type: upcomingCoupon.discount_type,
                    discount_value: upcomingCoupon.discount_value,
                    condition_type: 'TOTAL_AMOUNT',
                    target_id: null,
                    is_cross_store: false,
                    coupon_store_id: upcomingCoupon.owner_store_id
                });
            } else if (highestMet) {
                // 더 높은 상위 쿠폰이 없고 최대 구간 달성 시
                suggestions.push({
                    rule_id: highestMet._id,
                    title: highestMet.name,
                    message: `🎉 최대 혜택 달성 완료! (${highestMet.discount_value.toLocaleString()}원 할인 가능)`,
                    achieved_message: `🎉 현재 ${highestMet.discount_value.toLocaleString()}원 즉시 할인 가능! 👑`,
                    is_achieved: true,
                    remaining_amount: 0,
                    progress: 100,
                    discount_type: highestMet.discount_type,
                    discount_value: highestMet.discount_value,
                    condition_type: 'TOTAL_AMOUNT',
                    target_id: null,
                    is_cross_store: false,
                    coupon_store_id: highestMet.owner_store_id
                });
            }
        }

        res.json({
            total_amount: totalAmount,
            suggestions: suggestions.filter(s => s.progress > 0) // 조금이라도 담은(진행된) 퀘스트만 필터링하여 출력
        });
    } catch (error) {
        console.error("checkEligibility Error:", error);
        res.status(500).json({ error: error.message });
    }
};
