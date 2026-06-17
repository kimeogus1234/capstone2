const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { resolveAuthUserId } = require('../utils/authUser');

/** 🛒 [Smart Inventory Sync] 고유 상품 선점 및 정찰제 통합 컨트롤러 */
const cartController = {
    // 🔍 1. 내 장바구니 보기
    getCart: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
            let cart = await Cart.findOne({ 
                userId, 
                $or: [{ status: 'CART' }, { status: { $exists: false } }, { status: null }] 
            }).populate('items.productId');
            if (!cart) return res.json({ userId, items: [], totalAmount: 0 });
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ➕ 2. 장바구니 담기 (유일제 선점 / 정찰제 통합)
    addToCart: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
            const { productId, variantSku, quantity = 1 } = req.body;

            const productDoc = await Product.findById(productId);
            if (!productDoc) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

            let cart = await Cart.findOne({ 
                userId, 
                $or: [{ status: 'CART' }, { status: { $exists: false } }, { status: null }] 
            });
            if (!cart) cart = new Cart({ userId, items: [] });

            // 해당 상품의 기본 가격 가져오기
            let price = productDoc.base_price;
            let finalVariantSku = null;

            // 옵션형 상품(B타입)인 경우 해당 SKU 세일가 매칭
            if (productDoc.display_template === 'B') {
                const variant = productDoc.variants.find(v => v.sku === variantSku);
                if (!variant) return res.status(400).json({ message: '해당 옵션의 상품이 없습니다.' });
                price = variant.sale_price;
                finalVariantSku = variant.sku;
            }

            // 이미 장바구니에 담겨있는지 확인 (ID 및 SKU 단위 매칭)
            const itemIndex = cart.items.findIndex(item => 
                item.productId?.toString() === productId && item.variantSku === finalVariantSku
            );

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += Number(quantity);
                cart.items[itemIndex].price = price; // 최신가 동기화
            } else {
                cart.items.push({ 
                    productId, 
                    variantSku: finalVariantSku, 
                    quantity: Number(quantity), 
                    price 
                });
            }

            await cart.save();
            res.status(201).json(cart);
        } catch (error) {
            console.error("Add to Cart Error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // ✏️ 3. 수량 수정 (정찰제 상품 전용)
    updateItem: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
            const { productId, variantSku, quantity } = req.body;
            const cart = await Cart.findOne({ 
                userId, 
                $or: [{ status: 'CART' }, { status: { $exists: false } }, { status: null }] 
            });
            if (!cart) return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });

            const itemIndex = cart.items.findIndex(p => 
                p.productId?.toString() === productId && p.variantSku === (variantSku || null)
            );

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity = Number(quantity);
                await cart.save();
            }
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ❌ 4. 특정 상품 삭제
    removeFromCart: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
            const { productId } = req.params; // 이 값은 카트 아이템의 고유 _id 혹은 상품 productId일 수 있음
            const { variantSku } = req.query;

            const cart = await Cart.findOne({ 
                userId, 
                $or: [{ status: 'CART' }, { status: { $exists: false } }, { status: null }] 
            });
            if (cart) {
                cart.items = cart.items.filter(p => {
                    const matchItemId = p._id?.toString() === productId;
                    const matchProduct = p.productId?.toString() === productId;
                    const matchSku = p.variantSku === (variantSku || null);
                    return !(matchItemId || (matchProduct && matchSku));
                });
                await cart.save();
            }
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🧹 5. 장바구니 비우기
    clearCart: async (req, res) => {
        try {
            const userId = resolveAuthUserId(req);
            if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
            await Cart.deleteOne({ 
                userId, 
                $or: [{ status: 'CART' }, { status: { $exists: false } }, { status: null }] 
            });
            res.json({ message: 'Cart cleared' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cartController;
