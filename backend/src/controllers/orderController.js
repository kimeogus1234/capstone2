const Order = require('../models/Order');
const promotionController = require('./promotionController');

// ✅ 모든 주문 조회 (페이지네이션 및 검색 필터링 포함)
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { search, status } = req.query;

        let query = {};
        if (status && status !== 'ALL') query.status = status;
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { contact: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        const totalCount = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('items.productId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
        
        const formattedOrders = orders.map(o => {
            const items = o.items || [];
            const firstItemName = items[0]?.name || items[0]?.productId?.name || '상품 정보 없음';
            const productText = (items.length > 0)
                ? `${firstItemName}${items.length > 1 ? ` 외 ${items.length - 1}건` : ''}`
                : '상품 정보 없음';

            return {
                id: o._id,
                _id: o._id.toString(),
                status: o.status || 'PAID',
                createdAt: o.createdAt || new Date(),
                delivery_type: o.delivery_type || 'HOME',
                customer: o.customerName || o.userId || '비회원',
                customerName: o.customerName || o.userId || '비회원',
                phone: o.shippingPhone || o.contact || '연락처 미기재',
                contact: o.shippingPhone || o.contact || '연락처 미기재',
                address: o.shippingAddress || o.address || '주소 미기재',
                shippingAddress: o.shippingAddress || o.address || '주소 미기재',
                total_amount: Number(o.totalAmount || o.totalPrice || 0),
                totalPrice: Number(o.totalAmount || o.totalPrice || 0),
                OrderItems: items.map(i => ({
                    product_name: i.name || i.productId?.name || '이름 없는 상품',
                    name: i.name || i.productId?.name || '이름 없는 상품',
                    quantity: i.quantity || 1,
                    price: i.price || 0,
                    variant_info: i.variant_info || null
                })),
                items: items.map(i => ({
                    product_name: i.name || i.productId?.name || '이름 없는 상품',
                    name: i.name || i.productId?.name || '이름 없는 상품',
                    quantity: i.quantity || 1,
                    price: i.price || 0,
                    variant_info: i.variant_info || null
                })),
                product: productText,
                displayStatus: mapStatusToKorean(o.status || 'PAID'),
                orderId: o.orderId || `ORD-${o._id}`,
                paymentMethod: o.paymentMethod || '결제수단 미기재',
                orderMemo: o.orderMemo || ''
            };
        });

        res.json({
            orders: formattedOrders,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ 주문 상태 변경
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // status가 한글일 수도 있고 영문일 수도 있으므로 처리
        const dbStatus = status.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/) ? reverseMapStatus(status) : status;
        await Order.findByIdAndUpdate(id, { status: dbStatus });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ 배달 기사님용 전체 배송 주문 조회 (포맷 가공 포함)
const getDeliveryOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 
            $or: [
                { delivery_type: { $in: ['HOME', 'DELIVERY'] } },
                { delivery_type: { $exists: false } },
                { delivery_type: null }
            ]
        }).sort({ createdAt: -1 });
        
        const formatted = orders.map(o => {
            let shipping = { address: o.shippingAddress || '주소 미기재', detailAddress: '', receiver: o.customerName || '고객', phone: o.contact || '010-0000-0000' };
            if (o.shippingAddress && o.shippingAddress.startsWith('{')) {
                try {
                    const parsed = JSON.parse(o.shippingAddress);
                    shipping = {
                        address: parsed.address || parsed.roadAddress || parsed.jibunAddress || '',
                        detailAddress: parsed.detailAddress || parsed.detail || '',
                        receiver: parsed.receiver || parsed.name || o.customerName || '고객',
                        phone: parsed.phone || parsed.contact || o.contact || '010-0000-0000'
                    };
                } catch (e) {
                    // JSON 파싱 실패시 기본 문자열 사용
                }
            }
            
            return {
                _id: o._id.toString(),
                orderNumber: o.orderId || `ORD-${o._id.toString().substring(0,8).toUpperCase()}`,
                shippingAddress: shipping,
                totalAmount: o.totalAmount || 0,
                status: o.status || 'PAID',
                orderMemo: o.orderMemo || '',
                items: (o.items || []).map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price
                }))
            };
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ 내 주문 조회 (소비자용)
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id.toString();
        const history = await Order.find({
            userId,
            status: { $in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'CANCELED', 'CANCEL_REQUESTED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED', 'EXCHANGED', 'RETURNED'] }
        }).populate('items.productId').sort({ updatedAt: -1 });

        const formattedHistory = history.map(order => {
            const orderObj = order.toObject();
            
            // 실시간 DB 데이터 안전 반환 (더미 없음)
            orderObj.shippingAddress = orderObj.shippingAddress || "배송지 정보 없음";
            orderObj.shippingPhone = orderObj.shippingPhone || orderObj.contact || "연락처 정보 없음";
            orderObj.orderMemo = orderObj.orderMemo || "문 앞에 두고 벨 눌러주세요!";
            orderObj.discountAmount = orderObj.discountAmount || 0;
            orderObj.customerName = orderObj.customerName || "고객";

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
};

const createOrder = async (req, res) => {
    const Product = require('../models/Product');
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, userId, totalAmount } = req.body;

        for (const item of items) {
            // 🔹 1. 옵션이 있는 경우 (Variant 매칭)
            let result = await Product.findOneAndUpdate(
                { 
                    _id: item.productId,
                    "variants.option_values.사이즈/색상": item.variant_info,
                    "variants.stock_quantity": { $gte: item.quantity }
                },
                { $inc: { "variants.$.stock_quantity": -item.quantity } },
                { session, new: true }
            );

            // 🔹 2. 옵션이 없는 정찰제 상품인 경우 (첫 번째 메인 변체 차감)
            if (!result) {
                result = await Product.findOneAndUpdate(
                    { 
                        _id: item.productId,
                        "variants.stock_quantity": { $gte: item.quantity }
                        // 옵션 조건 없이 재고가 있는 변체 중 첫 번째 것
                    },
                    { $inc: { "variants.$.stock_quantity": -item.quantity } },
                    { session, new: true }
                );
            }

            if (!result) {
                throw new Error(`상품 [${item.name}]의 재고가 부족합니다.`);
            }
        }

        const phoneVal = req.body.shippingPhone || req.body.contact || '010-0000-0000';
        req.body.contact = phoneVal;
        req.body.shippingPhone = phoneVal;

        const order = new Order(req.body);
        await order.save({ session });

        if (userId) {
            await promotionController.issueEligibleCoupons(userId, items, totalAmount);
        }

        await session.commitTransaction();
        res.status(201).json({ success: true, orderId: order._id });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

const seedOrders = async () => {
    // 이제 진짜 데이터(carts)를 쓰므로 테스트 데이터 생성은 하지 않습니다.
};

// 🔹 상태 매핑 함수 (사용자 요청 반영)
const mapStatusToKorean = (status) => {
    const map = {
        'PAID': '결제완료',
        'PREPARING': '상품준비중',
        'SHIPPING': '배송중',
        'DELIVERING': '배송중',
        'COMPLETED': '배송완료',
        'DELIVERED': '배송완료',
        'CANCELLED': '취소완료',
        'CANCEL_REQUESTED': '취소신청중',
        'RETURN_REQUESTED': '반품신청중',
        'RETURNED': '반품완료',
        'EXCHANGE_REQUESTED': '교환신청중',
        'EXCHANGED': '교환완료'
    };
    return map[status] || status;
};

const reverseMapStatus = (koreanStatus) => {
    const map = {
        '결제완료': 'PAID',
        '상품준비중': 'PREPARING',
        '배송중': 'SHIPPING',
        '배송완료': 'COMPLETED',
        '취소완료': 'CANCELLED',
        '취소신청중': 'CANCEL_REQUESTED',
        '반품신청중': 'RETURN_REQUESTED',
        '반품완료': 'RETURNED',
        '교환신청중': 'EXCHANGE_REQUESTED',
        '교환완료': 'EXCHANGED'
    };
    return map[koreanStatus] || koreanStatus;
};

module.exports = { getAllOrders, createOrder, updateOrderStatus, getMyOrders, seedOrders, getDeliveryOrders };
