const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const crypto = require('crypto');
const axios = require('axios');
const ConditionalReward = require('../models/ConditionalReward');
const UserCoupon = require('../models/UserCoupon');
const Product = require('../models/Product');
const { resolveAuthUserId } = require('../utils/authUser');

const fs = require('fs');
const path = require('path');

const confirmTossPayment = async ({ paymentKey, orderId, amount }) => {
    const secretKey = process.env.TOSS_SECRET_KEY;
    const logMsg = `[TOSS_DEBUG] ${new Date().toISOString()} - secretKey: "${secretKey}", paymentKey: "${paymentKey}", orderId: "${orderId}", amount: ${amount}\n`;
    fs.appendFileSync(path.join(__dirname, '../../toss_debug.log'), logMsg, 'utf8');
    if (!secretKey) {
        const err = new Error('Server is missing TOSS_SECRET_KEY');
        err.status = 500;
        throw err;
    }

    const auth = Buffer.from(`${secretKey}:`).toString('base64');
    try {
        const response = await axios.post(
            'https://api.tosspayments.com/v1/payments/confirm',
            { paymentKey, orderId, amount },
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        return response.data;
    } catch (error) {
        const status = error.response?.status || 500;
        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            'Toss confirm failed';
        const err = new Error(message);
        err.status = status;
        throw err;
    }
};

/** 💳 [Instant One-Click Checkout] 지연 없는 즉각 결제 컨트롤러 */
const orderController = {
    // 💳 1. 즉시 결제 처리 (장바구니 -> 결제완료/주문내역 전환)
    createOrder: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
            const { customerName, shippingAddress, shippingPhone, paymentMethod, orderMemo, totalAmount, couponId, discountAmount, paymentProvider, tossPaymentKey, tossOrderId, tossAmount } = req.body;

            // [A] 현재 활성화된(상태가 CART인) 장바구니 찾기 (기존의 status 필드가 없는 장바구니도 포함하도록 $or 조건 적용)
            const cart = await Cart.findOne({ 
                userId, 
                $or: [{ status: 'CART' }, { status: { $exists: false } }, { status: null }] 
            });

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: '장바구니가 비어있습니다. 상품을 먼저 담아주세요! 🛒' });
            }

            // [B] 🏆 [핵심] 결제 시스템은 나중에! 지금은 즉시 PAID(결제완료)로 승격!
            let orderId = `PREMIUM-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

            const normalizedProvider =
                paymentProvider ||
                (typeof paymentMethod === 'string' && paymentMethod.toLowerCase().includes('toss') ? 'TOSS' : null);

            const amountToConfirm = typeof tossAmount === 'number' ? tossAmount : totalAmount || cart.totalAmount;

            if (normalizedProvider === 'TOSS') {
                if (!tossPaymentKey || !tossOrderId) {
                    return res.status(400).json({ message: 'Toss payment info is required (paymentKey, orderId).' });
                }
                await confirmTossPayment({
                    paymentKey: tossPaymentKey,
                    orderId: tossOrderId,
                    amount: amountToConfirm
                });
                orderId = tossOrderId;
            }

            cart.status = 'PAID';
            cart.orderId = orderId;
            cart.customerName = customerName || req.user.name || "고객";
            cart.shippingAddress = shippingAddress || "기본 배송지";
            cart.shippingPhone = shippingPhone || "010-0000-0000";
            cart.paymentMethod = paymentMethod || "IMMEDIATE_PAY";
            cart.orderMemo = orderMemo || "문 앞에 두고 벨 눌러주세요!";
            cart.totalAmount = totalAmount || cart.totalAmount; // 💰 할인 적용된 실제 결제 금액 저장
            cart.couponId = couponId || null;
            cart.discountAmount = discountAmount || 0;
            cart.delivery_type = 'HOME';

            // 🎫 사용 완료 쿠폰을 DB 상에서 "사용 완료(isUsed = true)"로 확실하게 업데이트하여 재사용 방지!
            if (couponId) {
                const userCoupon = await UserCoupon.findOne({ userId, couponId, isUsed: false });
                if (userCoupon) {
                    userCoupon.isUsed = true;
                    await userCoupon.save();
                } else {
                    // 일반 공개 쿠폰을 사용한 경우에도 중복 사용 방지를 위해 사용 완료 기록 적재
                    await UserCoupon.create({
                        userId,
                        couponId,
                        isUsed: true,
                        issuedAt: new Date()
                    });
                }
            }

            // 저장하는 순간 이 바구니는 이제 '주문 내역' 서랍으로 영구 이동합니다!
            await cart.save();

            // 🎁 [Private Coupon Logic] 조건부 리워드 체크
            let rewardedCoupons = [];
            try {
                // 1. 이번 주문에 포함된 모든 매장 ID 수집
                const productIds = cart.items.map(item => item.productId);
                const products = await Product.find({ _id: { $in: productIds } });
                const storeIds = [...new Set(products.map(p => p.storeId).filter(id => id))];

                // 2. 활성화된 모든 리워드 룰 조회
                const rules = await ConditionalReward.find({ is_active: true }).sort({ priority: -1 });

                for (const rule of rules) {
                    let isSatisfied = false;

                    if (rule.condition.type === 'STORE_TOTAL') {
                        // 특정 매장 상품이 포함되어 있고, 그 매장 구매액이 기준 이상인지 확인
                        const storeItems = products.filter(p => p.storeId?.toString() === rule.condition.target_id?.toString());
                        const storeAmount = cart.items
                            .filter(item => storeItems.some(p => p._id.toString() === item.productId.toString()))
                            .reduce((sum, item) => sum + (item.price * item.quantity), 0);

                        if (storeIds.some(id => id.toString() === rule.condition.target_id?.toString()) && storeAmount >= rule.condition.min_amount) {
                            isSatisfied = true;
                        }
                    } else if (rule.condition.type === 'ORDER_TOTAL') {
                        if (cart.totalAmount >= rule.condition.min_amount) {
                            isSatisfied = true;
                        }
                    }

                    if (isSatisfied) {
                        // 3. 이미 지급받았는지 확인 (중복 방지)
                        const alreadyIssued = await UserCoupon.findOne({ userId, couponId: rule.reward.coupon_id });
                        if (!alreadyIssued) {
                            await UserCoupon.create({
                                userId,
                                couponId: rule.reward.coupon_id,
                                issuedAt: new Date()
                            });
                            rewardedCoupons.push({
                                title: rule.title,
                                message: rule.reward.message
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Reward Logic Error:", err);
            }

            res.status(201).json({
                message: '결제가 성공적으로 완료되었습니다! 🎉',
                orderId,
                status: 'PAID',
                rewards: rewardedCoupons // 지급된 쿠폰 정보 반환
            });

        } catch (error) {
            console.error("Instant Checkout Error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // 🔍 2. 내 결제 내역 조회 (상태가 PAID인 이전 바구니들 싹 모아오기)
    getUserOrders: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

            // 🎯 해당 계정의 결제 완료 주문만 조회 (userId 문자열 통일)
            const history = await Cart.find({
                userId,
                status: { $in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'CANCELED', 'CANCEL_REQUESTED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED', 'EXCHANGED', 'RETURNED'] }
            }).populate('items.productId').sort({ updatedAt: -1 });

            // 클라이언트가 기대하는 name, image 구조로 변환
            const formattedHistory = history.map(order => {
                const orderObj = order.toObject();
                
                orderObj.shippingAddress = orderObj.shippingAddress || '';
                orderObj.shippingPhone = orderObj.shippingPhone || '';
                orderObj.orderMemo = orderObj.orderMemo || '';
                orderObj.discountAmount = orderObj.discountAmount || 0;
                
                // 가격 정보 폴백 (전체 상품 가격 합산)
                if (!orderObj.totalAmount) {
                    orderObj.totalAmount = orderObj.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                }

                orderObj.items = orderObj.items.map(item => {
                    const productInfo = item.productId;
                    return {
                        ...item,
                        productId: productInfo?._id || item.productId,
                        name: item.name || productInfo?.name || '상품 정보 없음',
                        image: item.image || productInfo?.images?.main || productInfo?.image || ''
                    };
                });
                return orderObj;
            });

            res.json(formattedHistory);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 📊 3. 주문 상태별 개수 조회 (내 정보 화면용)
    getOrderStatusCounts: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

            // 유저의 모든 주문(CART 상태가 아닌 것) 가져오기
            const orders = await Cart.find({
                userId,
                status: { $ne: 'CART' }
            });

            // 상태별 개수 집계
            const counts = {
                PAID: 0,        // 결제완료 (결제대기 대용)
                PREPARING: 0,   // 상품준비중
                SHIPPING: 0,    // 배송중
                DELIVERED: 0,   // 배송완료
                CANCELLED: 0,   // 취소완료
                RETURNED: 0     // 반품완료
            };

            orders.forEach(order => {
                const s = order.status;
                if (s === 'PAID') counts.PAID++;
                else if (s === 'PREPARING') counts.PREPARING++;
                else if (s === 'SHIPPING' || s === 'DELIVERING') counts.SHIPPING++;
                else if (s === 'DELIVERED' || s === 'COMPLETED') counts.DELIVERED++;
                else if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCEL_REQUESTED') counts.CANCELLED++;
                else if (s === 'RETURNED' || s === 'RETURN_REQUESTED' || s === 'EXCHANGE_REQUESTED' || s === 'EXCHANGED') counts.RETURNED++;
            });

            res.json({
                pending: counts.PAID + counts.PREPARING, // 결제대기/준비중 합산
                shipping: counts.SHIPPING,
                delivered: counts.DELIVERED,
                canceled: counts.CANCELLED + counts.RETURNED // 취소/반품/교환 합산
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ❌ 3. 주문 취소 (결제완료/준비중 → CANCELLED)
orderController.cancelOrder = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: '유효하지 않은 주문 ID입니다.' });
        }

        const order = await Cart.findOne({ _id: id, userId });
        if (!order) return res.status(404).json({ message: '해당 주문을 찾을 수 없습니다.' });

        // 취소는 배송 전(PAID, PREPARING)만 가능
        if (!['PAID', 'PREPARING'].includes(order.status)) {
            return res.status(400).json({
                message: '배송이 시작된 주문은 취소할 수 없습니다. 반품 신청을 이용해주세요.'
            });
        }

        order.status = 'CANCEL_REQUESTED';
        await order.save();

        res.json({ message: '주문이 취소되었습니다.', orderId: order.orderId });
    } catch (error) {
        console.error('Cancel Order Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 🔄 4. 반품 신청 (배송완료 → RETURNED)
orderController.returnOrder = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: '유효하지 않은 주문 ID입니다.' });
        }

        const order = await Cart.findOne({ _id: id, userId });
        if (!order) return res.status(404).json({ message: '해당 주문을 찾을 수 없습니다.' });

        // 반품은 배송중 이후(SHIPPING, COMPLETED, DELIVERED)만 가능
        if (!['SHIPPING', 'COMPLETED', 'DELIVERED'].includes(order.status)) {
            return res.status(400).json({
                message: '배송중 이후의 주문만 반품 신청이 가능합니다.'
            });
        }

        order.status = 'RETURN_REQUESTED';
        await order.save();

        res.json({ message: '반품 신청이 완료되었습니다.', orderId: order.orderId });
    } catch (error) {
        console.error('Return Order Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 🔄 5. 교환 신청 (배송중, 배송완료 → EXCHANGE_REQUESTED)
orderController.exchangeOrder = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: '유효하지 않은 주문 ID입니다.' });
        }

        const order = await Cart.findOne({ _id: id, userId });
        if (!order) return res.status(404).json({ message: '해당 주문을 찾을 수 없습니다.' });

        // 교환은 배송중 이후(SHIPPING, COMPLETED, DELIVERED)만 가능
        if (!['SHIPPING', 'COMPLETED', 'DELIVERED'].includes(order.status)) {
            return res.status(400).json({
                message: '배송 시작 이후의 주문만 교환 신청이 가능합니다.'
            });
        }

        order.status = 'EXCHANGE_REQUESTED';
        await order.save();

        res.json({ message: '교환 신청이 완료되었습니다.', orderId: order.orderId });
    } catch (error) {
        console.error('Exchange Order Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = orderController;
