const Product = require('../models/Product');
const Slot = require('../models/Slot');
const Order = require('../models/Order'); // 몽고디비 주문(carts) 모델

const stripBaseUrl = (url) => {
    if (typeof url !== 'string') return url;
    return url.replace(/^.*\/uploads\//, '');
};

const normalizeStatus = (status) => {
    if (!status) return 'ON_SALE';
    const s = String(status).toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
    const allowed = ['ON_SALE', 'OUT_OF_STOCK', 'HIDDEN', 'STOPPED'];
    if (allowed.includes(s)) return s;
    if (s === 'ON_SALE' || s.includes('SALE')) return 'ON_SALE';
    return 'ON_SALE';
};

const normalizeVariants = (variants = []) =>
    variants.map((v, idx) => ({
        sku: v.sku || `SKU-${Date.now()}-${idx}`,
        option_values: v.option_values || {},
        sale_price: Number(v.sale_price ?? v.price ?? 0),
        discount_rate: Number(v.discount_rate || 0),
        stock_quantity: Number(v.stock_quantity || 0),
        nfc_uid: v.nfc_uid,
        nfc_link: v.nfc_link,
        is_main_variant: idx === 0 || !!v.is_main_variant,
    }));

// 1. 모든 상품 조회 (페이지네이션 및 통계 포함)
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { storeId, category, search } = req.query;
        
        let query = {};
        if (req.user && req.user.role === 'STAFF') query.storeId = req.user.assignedStoreId;
        if (storeId) query.storeId = storeId;
        
        if (category) {
            const Category = require('../models/Category');
            const allCategories = await Category.find({});
            const getDescendantIds = (parentId) => {
                let ids = [parentId.toString()];
                const children = allCategories.filter(c => c.parentId && c.parentId.toString() === parentId.toString());
                children.forEach(child => { ids = [...ids, ...getDescendantIds(child._id)]; });
                return ids;
            };
            query.category = { $in: getDescendantIds(category) };
        }
        
        if (search) query.name = { $regex: search, $options: 'i' };

        const totalCount = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('storeId')
            .populate('category')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
        
        // 현재 페이지의 상품들에 대해서만 통계 계산 및 재고 합산 (성능 최적화)
        const productsWithStats = await Promise.all(products.map(async (p) => {
            const pObj = p.toObject();
            
            // 🔹 실시간 재고 합산 (모든 변체의 합)
            pObj.total_stock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;

            try {
                const orders = await Order.find({ 'items.productId': p._id.toString(), 'status': { $ne: 'CANCELLED' } });
                let soldCount = 0;
                let soldVariants = [];
                orders.forEach(o => {
                    o.items.forEach(item => {
                        if (item.productId === p._id.toString()) {
                            soldCount += item.quantity;
                            if (item.variant_info) soldVariants.push(item.variant_info);
                        }
                    });
                });
                return { ...pObj, sales_stats: { sold_count: soldCount, sold_variants: soldVariants } };
            } catch (e) {
                return { ...pObj, sales_stats: { sold_count: 0, sold_variants: [] } };
            }
        }));

        res.json({
            products: productsWithStats,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};

// 2. 상품 상세 조회
const getProductDetail = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Not found' });
        const slots = await Slot.find({ product_id: req.params.id.toString() });
        const pData = product.toObject();
        pData.Slots = slots;
        res.json(pData);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 3. 상품 등록
const createProduct = async (req, res) => {
    try {
        if (req.user.role === 'STAFF') req.body.storeId = req.user.assignedStoreId;
        if (req.body.product_images) req.body.product_images = req.body.product_images.map(stripBaseUrl);
        req.body.status = normalizeStatus(req.body.status);

        if (req.body.display_template === 'B' && Array.isArray(req.body.variants) && req.body.variants.length > 0) {
            req.body.variants = normalizeVariants(req.body.variants);
            if (!req.body.base_price && req.body.variants[0]) {
                req.body.base_price = req.body.variants[0].sale_price;
            }
        }

        // 🔹 정찰제(A타입) 상품일 경우 기본 변체 생성
        if (req.body.display_template === 'A' || !req.body.display_template) {
            req.body.variants = [{
                sku: `SKU-${Date.now()}`,
                sale_price: req.body.base_price,
                stock_quantity: req.body.stock_quantity || 0,
                is_main_variant: true
            }];
        }

        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 4. 상품 수정
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Not found' });

        if (req.body.status) req.body.status = normalizeStatus(req.body.status);

        const template = req.body.display_template || product.display_template || 'A';

        // 🔹 정찰제(A타입) 재고 업데이트 지원
        if (template === 'A' && req.body.stock_quantity !== undefined) {
            if (product.variants && product.variants.length > 0) {
                product.variants[0].stock_quantity = req.body.stock_quantity;
                product.variants[0].sale_price = req.body.base_price || product.base_price;
            } else {
                product.variants = [{
                    sku: `SKU-${Date.now()}`,
                    sale_price: req.body.base_price || product.base_price,
                    stock_quantity: req.body.stock_quantity,
                    is_main_variant: true
                }];
            }
            product.markModified('variants');
        }

        // 🔹 옵션형(B타입) variants / options 반영
        if (template === 'B') {
            req.body.display_template = 'B';
            if (Array.isArray(req.body.variants)) {
                product.variants = normalizeVariants(req.body.variants);
                product.markModified('variants');
            }
            if (Array.isArray(req.body.options)) {
                product.options = req.body.options;
                product.markModified('options');
            }
            if (req.body.base_price !== undefined) {
                product.base_price = req.body.base_price;
            } else if (product.variants?.length > 0) {
                product.base_price = product.variants[0].sale_price;
            }
        }

        const { variants, options, ...rest } = req.body;
        Object.assign(product, rest);
        await product.save();
        res.json(product);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 5. 상품 삭제
const deleteProduct = async (req, res) => {
    try {
        await Slot.deleteMany({ product_id: req.params.id.toString() });
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 6. NFC UID 업데이트
const updateProductNfc = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.nfc_uid = req.body.nfc_uid;
        await product.save();
        res.json(product);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 7. NFC UID로 상품 조회
const getProductByNfcUid = async (req, res) => {
    try {
        const product = await Product.findOne({ nfc_uid: req.params.uid });
        if (!product) return res.status(404).json({ message: 'Not found' });
        const slots = await Slot.find({ product_id: product._id.toString() });
        const pData = product.toObject();
        pData.Slots = slots;
        res.json(pData);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 8. 재고 채우기
const refillProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product.display_template === 'B') {
            if (req.body.variants) {
                req.body.variants.forEach(nv => {
                    if (!product.variants.some(ev => ev.product_number === nv.product_number)) product.variants.push(nv);
                });
            }
        } else {
            product.quantity = (product.quantity || 0) + Number(req.body.quantity || 0);
        }
        await product.save();
        res.json(product);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 9. 추천 상품 조회
const getRecommendations = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('related_products');
        let recs = product.related_products || [];
        if (recs.length < 4) {
            const more = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(10);
            recs = [...recs, ...more];
        }
        res.json(recs.slice(0, 10));
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 10. 요약 정보 조회 (앱용)
const getSummary = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const categories = await Category.find({}).sort({ order: 1 });
        const products = await Product.find({}).populate('storeId').populate('category');
        res.json({ categories, products });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 11. NFC 리다이렉트 페이지 렌더링
const renderNfcRedirect = async (req, res) => {
    const { id } = req.params;
    const appDeepLink = `smartstore://nfc/product/${id}`;
    res.send(`<html><body><script>window.location.href = "${appDeepLink}";</script></body></html>`);
};

// 12. 벌크 삭제
const bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });
        
        // 상품 삭제 및 관련 슬롯 파괴 (Parallel 실행)
        const idStrings = ids.map((id) => id.toString());
        await Promise.all([
            Slot.deleteMany({ product_id: { $in: idStrings } }),
            Product.deleteMany({ _id: { $in: ids } })
        ]);
        
        res.json({ message: `${ids.length} products deleted successfully` });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 13. 벌크 상태 업데이트
const bulkUpdateProductStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });
        
        await Product.updateMany(
            { _id: { $in: ids } },
            { $set: { status: status.toUpperCase() } }
        );
        
        res.json({ message: `${ids.length} products status updated to ${status}` });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { 
    getAllProducts, getProductDetail, createProduct, updateProduct, 
    deleteProduct, updateProductNfc, refillProduct, getProductByNfcUid, 
    renderNfcRedirect, getRecommendations, getSummary,
    bulkDeleteProducts, bulkUpdateProductStatus
};
