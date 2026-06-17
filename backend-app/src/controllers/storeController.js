const Store = require('../models/Store');

// 🏪 [소비자용] 매장 리스트 가져오기 (메인 백엔드 규격에 맞게 보정)
const getStores = async (req, res) => {
    try {
        const { floor, search, type } = req.query;
        let filter = {};

        if (floor && floor !== 'ALL') filter.floor = floor;
        if (type) filter.type = type;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const stores = await Store.find(filter).sort({ name: 1 });
        
        // 메인 백엔드와 규격을 맞춰 { stores, totalCount } 형태로 반환
        res.json({ 
            stores: stores, 
            totalCount: stores.length 
        });
    } catch (error) {
        console.error("Store Fetch Error:", error);
        res.status(500).json({ message: "매장 목록을 불러오지 못했습니다.", error: error.message });
    }
};

module.exports = {
    getStores
};
