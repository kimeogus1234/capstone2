const Product = require('../models/Product');
const mongoose = require('mongoose');

// 헬퍼 함수: 특정 상품의 별점 통계 가져오기
const getReviewStats = async (productId) => {
    try {
        const db = mongoose.connection.useDb('test');
        const collection = db.collection('review');
        const reviews = await collection.find({
            $or: [
                { product_id: productId.toString() },
                { product_id: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : null }
            ]
        }).toArray();

        if (reviews.length === 0) return { averageRating: 0, reviewCount: 0 };

        const sum = reviews.reduce((acc, cur) => acc + (cur.rating || 0), 0);
        return {
            averageRating: parseFloat((sum / reviews.length).toFixed(1)),
            reviewCount: reviews.length
        };
    } catch (err) {
        return { averageRating: 0, reviewCount: 0 };
    }
};

// [소비자용] 전체 상품 조회 (페이지네이션 지원)
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { status: 'ON_SALE' }; 
        
        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Product.countDocuments(filter);

        // 각 상품별 별점 정보 추가
        const productsWithStats = await Promise.all(products.map(async (p) => {
            const stats = await getReviewStats(p._id);
            return { ...p.toObject(), ...stats };
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

// [소비자용] 상품 상세 조회
const getProductDetail = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('storeId', 'name floor locationCode');
        
        if (!product) return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
        
        const stats = await getReviewStats(product._id);
        res.json({ ...product.toObject(), ...stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// [소비자용] 프리미엄 검색 기능
const searchProducts = async (req, res) => {
    try {
        const { name: queryName, type, categoryId, storeId } = req.query;
        let filter = { status: 'ON_SALE' };

        if (type === 'category' && categoryId) {
            const Category = require('../models/Category');
            const allCategories = await Category.find({});
            const getDescendantIds = (parentId) => {
                let ids = [parentId.toString()];
                const children = allCategories.filter(c => c.parentId && c.parentId.toString() === parentId.toString());
                children.forEach(child => {
                    ids = [...ids, ...getDescendantIds(child._id)];
                });
                return ids;
            };
            filter.category = { $in: getDescendantIds(categoryId) };
        } else if (type === 'store' && storeId) {
            filter.storeId = storeId;
        } else if (queryName) {
            filter.name = { $regex: queryName, $options: 'i' };
        }

        const results = await Product.find(filter).sort({ createdAt: -1 });
        
        // 검색 결과에 별점 정보 추가
        const productsWithStats = await Promise.all(results.map(async (p) => {
            const stats = await getReviewStats(p._id);
            return { ...p.toObject(), ...stats };
        }));

        res.json({
            products: productsWithStats,
            totalCount: results.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// NFC 관련 기능은 소비자 앱의 핵심이므로 유지
const getProductByNfcUid = async (req, res) => {
    try {
        const { uid } = req.params;
        const product = await Product.findOne({ nfc_uid: uid, status: 'ON_SALE' });
        if (!product) return res.status(404).json({ message: '등록되지 않았거나 판매 중이 아닌 상품입니다.' });

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductDetail,
    searchProducts,
    getProductByNfcUid
    // ⚠️ 관리자용 기능(create, update, delete)은 보안을 위해 앱 백엔드에서 제외합니다.
};
