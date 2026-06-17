const Coupon = require('../models/Coupon');
const CouponRule = require('../models/CouponRule');
const UserCoupon = require('../models/UserCoupon');

// 모든 사용 가능한 쿠폰 조회 (소비자용)
exports.getAvailableCoupons = async (req, res) => {
    try {
        const now = new Date();
        const userId = req.user ? req.user.id : null;

        // 1. 누구나 쓸 수 있는 공개 쿠폰
        const publicCoupons = await Coupon.find({
            is_active: true,
            is_public: true,
            valid_from: { $lte: now },
            valid_until: { $gte: now }
        });

        // 2. 사용자가 보유한 비공개 쿠폰 (보상형)
        let ownedCoupons = [];
        if (userId) {
            const userCoupons = await UserCoupon.find({ user_id: userId, is_used: false }).populate('coupon_id');
            ownedCoupons = userCoupons
                .filter(uc => uc.coupon_id && uc.coupon_id.is_active)
                .map(uc => uc.coupon_id);
        }

        // 중복 제거 후 합치기
        const allCoupons = [...publicCoupons, ...ownedCoupons];
        const uniqueCoupons = Array.from(new Set(allCoupons.map(c => c._id.toString())))
            .map(id => allCoupons.find(c => c._id.toString() === id));

        res.json(uniqueCoupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 사용자가 보유한 쿠폰함 조회
exports.getMyCoupons = async (req, res) => {
    try {
        const userCoupons = await UserCoupon.find({ user_id: req.user.id, is_used: false })
            .populate('coupon_id')
            .sort({ issued_at: -1 });
            
        res.json(userCoupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 주문 완료 시 쿠폰 자동 발급 (내부 함수)
exports.issueEligibleCoupons = async (userId, items, totalAmount) => {
    try {
        const rules = await CouponRule.find({ is_active: true }).populate('reward.coupon_id');
        
        for (const rule of rules) {
            let currentAmount = 0;
            
            if (rule.condition.type === 'TOTAL_AMOUNT') {
                currentAmount = totalAmount;
            } else if (rule.condition.type === 'STORE_TOTAL') {
                currentAmount = items
                    .filter(item => item.storeId === rule.condition.target_id)
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            } else if (rule.condition.type === 'CATEGORY_TOTAL') {
                currentAmount = items
                    .filter(item => item.categoryId === rule.condition.target_id)
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }

            // 조건 충족 시 쿠폰 발급
            if (currentAmount >= rule.condition.min_amount) {
                // 이미 발급받았는지 확인 (중복 발급 방지 옵션)
                const alreadyIssued = await UserCoupon.findOne({ user_id: userId, coupon_id: rule.reward.coupon_id });
                if (!alreadyIssued) {
                    await UserCoupon.create({
                        user_id: userId,
                        coupon_id: rule.reward.coupon_id
                    });
                    console.log(`[쿠폰 발급] 유저 ${userId}에게 '${rule.reward.coupon_id.name}' 쿠폰이 지급되었습니다.`);
                }
            }
        }
    } catch (error) {
        console.error('쿠폰 발급 중 오류:', error.message);
    }
};

// 쿠폰 생성 (관리자/매장직원용)
exports.createCoupon = async (req, res) => {
    try {
        const { role, id, assignedStoreId } = req.user;
        const couponData = { ...req.body, created_by: id };

        // STAFF 권한인 경우 제약 사항 강제
        if (role === 'STAFF') {
            if (!assignedStoreId) {
                return res.status(403).json({ message: '배정된 매장이 없어 쿠폰을 생성할 수 없습니다.' });
            }
            couponData.owner_store_id = assignedStoreId;
            
            // STAFF는 전체(ALL)나 다른 카테고리 쿠폰을 생성할 수 없게 제한 (선택 사항)
            if (couponData.scope === 'ALL') {
                couponData.scope = 'STORE';
                couponData.applicable_ids = [assignedStoreId];
            }
        }

        const coupon = await Coupon.create(couponData);
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 쿠폰 수정 (관리자/매장직원용)
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, assignedStoreId } = req.user;
        
        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).json({ message: '쿠폰을 찾을 수 없습니다.' });

        // STAFF는 본인 매장 쿠폰만 수정 가능
        if (role === 'STAFF' && coupon.owner_store_id !== assignedStoreId) {
            return res.status(403).json({ message: '본인 매장의 쿠폰만 수정할 수 있습니다.' });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedCoupon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 쿠폰 목록 (관리자/매장직원용)
exports.getAllCoupons = async (req, res) => {
    try {
        const { role, assignedStoreId } = req.user;
        let query = {};

        // STAFF는 자기 매장 쿠폰만 조회
        if (role === 'STAFF') {
            query = { owner_store_id: assignedStoreId };
        }

        const coupons = await Coupon.find(query).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 쿠폰 상세 및 검증 (핵심 로직)
exports.validateCoupon = async (req, res) => {
    try {
        const { code, items } = req.body; // items: [{ productId, storeId, categoryId, price, quantity }]
        const now = new Date();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            is_active: true,
            valid_from: { $lte: now },
            valid_until: { $gte: now }
        });

        if (!coupon) return res.status(404).json({ message: '유효하지 않거나 만료된 쿠폰입니다.' });

        // 1. 적용 대상 상품 필터링 (Scope 기반)
        let eligibleItems = [];
        if (coupon.scope === 'ALL') {
            eligibleItems = items;
        } else {
            const applicableIds = coupon.applicable_ids.map(id => id.toString());
            
            if (coupon.scope === 'STORE') {
                eligibleItems = items.filter(item => applicableIds.includes(item.storeId));
            } else if (coupon.scope === 'CATEGORY') {
                eligibleItems = items.filter(item => applicableIds.includes(item.categoryId));
            } else if (coupon.scope === 'PRODUCT') {
                eligibleItems = items.filter(item => applicableIds.includes(item.productId));
            }
        }

        if (eligibleItems.length === 0) {
            return res.status(400).json({ message: '이 쿠폰을 사용할 수 있는 상품이 장바구니에 없습니다.' });
        }

        // 2. 적용 대상 금액 계산
        const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

        if (eligibleTotal < Number(coupon.min_order_amount)) {
            return res.status(400).json({ 
                message: `적용 대상 상품 금액이 최소 ${Number(coupon.min_order_amount).toLocaleString()}원 이상이어야 합니다.` 
            });
        }

        // 3. 할인 금액 계산
        let discount = 0;
        if (coupon.discount_type === 'AMOUNT') {
            discount = Number(coupon.discount_value);
        } else {
            discount = eligibleTotal * (Number(coupon.discount_value) / 100);
            if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
                discount = Number(coupon.max_discount_amount);
            }
        }

        res.json({ 
            coupon, 
            discount_amount: Math.floor(discount),
            eligible_items_count: eligibleItems.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 프로모션 규칙 관리 (관리자/매장직원용) ---

exports.createPromotionRule = async (req, res) => {
    try {
        const { role, id: userId, assignedStoreId } = req.user;
        const ruleData = {
            ...req.body,
            created_by: userId,
            owner_store_id: role === 'STAFF' ? assignedStoreId : (req.body.owner_store_id || null)
        };

        const rule = new CouponRule(ruleData);
        await rule.save();
        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllPromotionRules = async (req, res) => {
    try {
        const { role, assignedStoreId } = req.user;
        let query = {};

        if (role === 'STAFF') {
            query = { owner_store_id: assignedStoreId };
        }

        const rules = await CouponRule.find(query)
            .populate('reward.coupon_id')
            .sort({ priority: -1, createdAt: -1 });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deletePromotionRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, assignedStoreId } = req.user;
        
        const rule = await CouponRule.findById(id);
        if (!rule) return res.status(404).json({ message: '규칙을 찾을 수 없습니다.' });

        if (role === 'STAFF' && rule.owner_store_id !== assignedStoreId) {
            return res.status(403).json({ message: '권한이 없습니다.' });
        }

        await CouponRule.findByIdAndDelete(id);
        res.json({ message: '성공적으로 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePromotionRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, assignedStoreId } = req.user;
        
        const rule = await CouponRule.findById(id);
        if (!rule) return res.status(404).json({ message: '규칙을 찾을 수 없습니다.' });

        if (role === 'STAFF' && rule.owner_store_id !== assignedStoreId) {
            return res.status(403).json({ message: '권한이 없습니다.' });
        }

        const updatedRule = await CouponRule.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedRule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 프로모션 어드바이저 (앱/소비자용) ---

exports.checkEligibility = async (req, res) => {
    try {
        const { items } = req.body; // [{ productId, storeId, categoryId, price, quantity }]
        const rules = await CouponRule.find({ is_active: true }).populate('reward.coupon_id');
        
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const suggestions = rules.map(rule => {
            let currentAmount = 0;
            
            if (rule.condition.type === 'TOTAL_AMOUNT') {
                currentAmount = totalAmount;
            } else if (rule.condition.type === 'STORE_TOTAL') {
                currentAmount = items
                    .filter(item => item.storeId === rule.condition.target_id)
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            } else if (rule.condition.type === 'CATEGORY_TOTAL') {
                currentAmount = items
                    .filter(item => item.categoryId === rule.condition.target_id)
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }

            const remaining = rule.condition.min_amount - currentAmount;
            
            // 🤝 [상생 협력 프로모션 감지] 구매 대상 매장과 보상 쿠폰 매장이 다른 경우 감지
            const couponStoreId = rule.reward.coupon_id?.owner_store_id;
            const targetStoreId = rule.condition.type === 'STORE_TOTAL' ? rule.condition.target_id : null;
            const isCrossStore = !!(targetStoreId && couponStoreId && targetStoreId !== couponStoreId);

            return {
                rule_id: rule._id,
                title: rule.title,
                message: rule.reward.message,
                is_achieved: remaining <= 0,
                remaining_amount: remaining > 0 ? remaining : 0,
                progress: Math.min(Math.round((currentAmount / rule.condition.min_amount) * 100), 100),
                discount_type: rule.reward.coupon_id?.discount_type,
                discount_value: rule.reward.coupon_id?.discount_value,
                condition_type: rule.condition.type,
                target_id: rule.condition.target_id,
                is_cross_store: isCrossStore,
                coupon_store_id: couponStoreId
            };
        });

        res.json({
            total_amount: totalAmount,
            suggestions: suggestions.filter(s => s.progress > 0) // 조금이라도 진행된 것만 노출
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 쿠폰 삭제
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, assignedStoreId } = req.user;
        
        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).json({ message: '쿠폰을 찾을 수 없습니다.' });

        if (role === 'STAFF' && coupon.owner_store_id !== assignedStoreId) {
            return res.status(403).json({ message: '권한이 없습니다.' });
        }

        await Coupon.findByIdAndDelete(id);
        res.json({ message: '쿠폰이 성공적으로 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
