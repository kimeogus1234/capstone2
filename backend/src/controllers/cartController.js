const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 장바구니 상품 추가
exports.addToCart = async (req, res) => {
    try {
        const { productId, variantSku, quantity } = req.body;
        const userId = req.user.id; // From verifyToken middleware

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

        // 해당 변체의 가격 찾기
        let price = product.base_price;
        if (variantSku) {
            const variant = product.variants.find(v => v.sku === variantSku);
            if (variant) price = variant.sale_price;
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // 이미 있는 상품인지 확인 (ID와 SKU가 같아야 함)
        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId && item.variantSku === variantSku
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += (quantity || 1);
            cart.items[itemIndex].price = price; // 최신 가격으로 업데이트
        } else {
            cart.items.push({ productId, variantSku, quantity: quantity || 1, price });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 장바구니 조회 (실시간 재고 체크 포함)
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id })
            .populate('items.productId'); // 모든 필드 로드 (재고 체크용)
        
        if (!cart) return res.json({ items: [] });

        const updatedItems = cart.items.map(item => {
            const product = item.productId;
            let isSoldOut = false;

            if (!product) {
                isSoldOut = true;
            } else if (product.display_template === 'B') {
                // 옵션형: 해당 SKU 재고 확인
                const variant = product.variants.find(v => v.sku === item.variantSku);
                if (!variant || variant.stock_quantity < item.quantity) isSoldOut = true;
            } else {
                // 일반형: 기본 재고 확인
                if ((product.base_stock_quantity || 0) < item.quantity) isSoldOut = true;
            }

            const itemObj = item.toObject();
            itemObj.isSoldOut = isSoldOut;
            return itemObj;
        });

        res.json({ items: updatedItems });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 장바구니 항목 삭제
exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ message: '장바구니가 비어있습니다.' });

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
