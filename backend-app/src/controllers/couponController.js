const Coupon = require('../models/Coupon');
const ConditionalReward = require('../models/ConditionalReward');
const UserCoupon = require('../models/UserCoupon');
const Product = require('../models/Product');
const { resolveAuthUserId } = require('../utils/authUser');

// Get all active coupons for the user
exports.getCoupons = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        const now = new Date();

        // 사용 완료된 쿠폰 ID (공개/비공개 공통 — 목록·결제 리워드에서 제외)
        const usedCouponIds = await UserCoupon.find({ userId, isUsed: true }).distinct('couponId');
        const usedCouponSet = new Set(usedCouponIds.map(id => id.toString()));
        
        // 1. 해당 유저가 자동 증정(Nudge) 등으로 받은 유효하고 아직 사용하지 않은 쿠폰 목록 조회
        const userCoupons = await UserCoupon.find({ userId, isUsed: false }).populate('couponId');
        const privateCoupons = userCoupons
            .filter(uc => uc.couponId && uc.couponId.is_active && new Date(uc.couponId.valid_until) >= now
                && !usedCouponSet.has(uc.couponId._id.toString()))
            .map(uc => {
                const c = uc.couponId.toObject();
                c.userCouponId = uc._id; // 보관함 ID
                c.isSurprise = true; // 퀘스트/Nudge 보상 쿠폰 표시
                return c;
            });

        // 2. 전체 공개 쿠폰 중, 이 유저가 이미 사용 완료하지 않은 공개 쿠폰들 조회
        const publicCoupons = await Coupon.find({
            is_active: true,
            is_public: true,
            valid_from: { $lte: now },
            valid_until: { $gte: now }
        });

        const availablePublicCoupons = publicCoupons
            .filter(c => !usedCouponSet.has(c._id.toString()))
            .map(c => {
                const obj = c.toObject();
                obj.isSurprise = false;
                return obj;
            });

        // 두 쿠폰 풀(Pool) 병합
        const combined = [...privateCoupons, ...availablePublicCoupons];

        res.json({ success: true, data: combined });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Validate a coupon by code
exports.validateCoupon = async (req, res) => {
    try {
        const { code, amount, items } = req.body; // items: [{ productId, storeId, categoryId, price, quantity }]
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        const now = new Date();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase().trim(),
            is_active: true,
            valid_from: { $lte: now },
            valid_until: { $gte: now }
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: '유효하지 않거나 만료된 쿠폰입니다.' });
        }

        // 1. 금액별/지급용 쿠폰의 1회 제한 검증
        const alreadyUsed = await UserCoupon.findOne({ userId, couponId: coupon._id, isUsed: true });
        if (alreadyUsed) {
            return res.status(400).json({ success: false, message: '이미 사용 완료한 쿠폰입니다.' });
        }

        // 2. 적용 가능 상품 필터링 및 금액 연산
        let applicableSum = amount; // 기본은 전체 금액 기준
        if (coupon.scope === 'STORE') {
            const targetStoreId = coupon.applicable_ids[0]?.toString();
            if (!targetStoreId) {
                return res.status(400).json({ success: false, message: '적용 대상 매장이 등록되지 않은 쿠폰입니다.' });
            }
            const matchingItems = (items || []).filter(item => item.storeId?.toString() === targetStoreId);
            if (matchingItems.length === 0) {
                return res.status(400).json({ success: false, message: '이 쿠폰은 지정된 매장의 상품에만 사용 가능합니다.' });
            }
            applicableSum = matchingItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        } else if (coupon.scope === 'CATEGORY') {
            const targetCategoryId = coupon.applicable_ids[0]?.toString();
            if (!targetCategoryId) {
                return res.status(400).json({ success: false, message: '적용 대상 카테고리가 등록되지 않은 쿠폰입니다.' });
            }
            const matchingItems = (items || []).filter(item => {
                const targetIdStr = targetCategoryId;
                const itemCategoryIdStr = item.categoryId?.toString() || '';
                return itemCategoryIdStr === targetIdStr;
            });
            if (matchingItems.length === 0) {
                return res.status(400).json({ success: false, message: '이 쿠폰은 지정된 카테고리의 상품에만 사용 가능합니다.' });
            }
            applicableSum = matchingItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        } else {
            // ALL (금액별/Nudge) 최소 주문 금액 검증
            if (amount < coupon.min_order_amount) {
                return res.status(400).json({ 
                    success: false, 
                    message: `최소 ${coupon.min_order_amount.toLocaleString()}원 이상 주문 시 사용 가능합니다.` 
                });
            }
        }

        // 3. 할인 금액 연산
        let discount = 0;
        const discountType = coupon.discount_type;
        const discountValue = Number(coupon.discount_value) || 0;

        if (discountType === 'AMOUNT') {
            discount = discountValue;
        } else if (discountType === 'PERCENTAGE' || discountType === 'PERCENT') {
            discount = (applicableSum * discountValue) / 100;
            if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
                discount = Number(coupon.max_discount_amount);
            }
        }

        // 할인 금액이 적용 가능한 매칭 상품 합계를 초과할 수 없음
        discount = Math.min(discount, applicableSum);
        discount = Math.floor(Math.max(0, discount));

        res.json({ 
            success: true, 
            data: {
                id: coupon._id,
                name: coupon.name,
                discount: discount,
                discount_type: discountType,
                discount_value: discountValue,
                scope: coupon.scope,
                applicable_ids: coupon.applicable_ids
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin CRUD
exports.createCoupon = async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        const savedCoupon = await coupon.save();
        res.status(201).json({ success: true, data: savedCoupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🎁 [NEW] 결제 전 리워드 체크 및 자동 지급 API
exports.checkRewards = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        const { totalAmount } = req.body; // 현재 장바구니/결제창 아이템 총액
        
        let metRewards = [];
        let upcomingRewards = [];

        const usedCouponIds = await UserCoupon.find({ userId, isUsed: true }).distinct('couponId');
        const usedCouponSet = new Set(usedCouponIds.map(id => id.toString()));

        // 🌟 [자동 연동] 활성화된 공개 금액별(ALL) 쿠폰 로드하여 실시간 넛지 결제 리워드로 반영!
        try {
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

            for (const coupon of activeAllCoupons) {
                if (usedCouponSet.has(coupon._id.toString())) {
                    continue;
                }

                const minAmount = coupon.min_order_amount;
                const remaining = minAmount - totalAmount;

                if (remaining <= 0) {
                    metRewards.push({
                        ruleId: coupon._id,
                        title: coupon.name,
                        message: `축하합니다! ${minAmount.toLocaleString()}원 구매 조건을 달성하셨습니다.`,
                        coupon: coupon
                    });
                } else {
                    const progress = Math.min(Math.floor((totalAmount / minAmount) * 100), 99);
                    upcomingRewards.push({
                        ruleId: coupon._id,
                        title: coupon.name,
                        current: totalAmount,
                        target: minAmount,
                        remaining: remaining,
                        progress: progress,
                        type: 'TOTAL_AMOUNT',
                        targetName: "장바구니 총액"
                    });
                }
            }
        } catch (couponErr) {
            console.error("Auto Coupon Checkout Suggestion Error:", couponErr);
        }

        upcomingRewards.sort((a, b) => b.progress - a.progress);

        res.json({
            success: true,
            met: metRewards,
            upcoming: upcomingRewards
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
