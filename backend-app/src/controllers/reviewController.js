const mongoose = require('mongoose');

/** 💬 [NEW] 프리미엄 리뷰 컨트롤러 통합 */
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const db = mongoose.connection.useDb('test'); // 몽고디비 'test' DB 사용
        const collection = db.collection('review');

        const reviews = await collection.find({
            $or: [
                { product_id: productId },
                { product_id: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : null }
            ]
        }).toArray();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: "리뷰 조회 실패", error: error.message });
    }
};

const submitReview = async (req, res) => {
    try {
        const { product_id, user_email, user_name, rating, content, media } = req.body;
        const db = mongoose.connection.useDb('test');
        const collection = db.collection('review');

        const result = await collection.insertOne({
            product_id,
            user_email: user_email || "guest@example.com",
            user_name: user_name || "익명 쇼퍼",
            rating: rating || 5,
            content,
            media: media || [],
            created_at: new Date()
        });
        res.status(201).json({ message: "리뷰 등록 성공!", result });
    } catch (error) {
        res.status(500).json({ message: "리뷰 등록 실패", error: error.message });
    }
};

module.exports = { getProductReviews, submitReview };
