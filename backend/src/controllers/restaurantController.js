const Restaurant = require('../models/Restaurant');

// 🔹 모든 식당 조회 (페이지네이션 포함)
exports.getAllRestaurants = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { floor, search } = req.query;
        
        let query = {};
        if (floor && floor !== 'ALL') query.floor = floor;
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const totalCount = await Restaurant.countDocuments(query);
        const restaurants = await Restaurant.find(query)
            .sort({ floor: 1, name: 1 })
            .limit(limit)
            .skip(skip);

        res.json({
            restaurants,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 식당 상세 조회
exports.getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 식당 등록
exports.createRestaurant = async (req, res) => {
    try {
        const restaurant = new Restaurant(req.body);
        const newRestaurant = await restaurant.save();
        res.status(201).json(newRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 🔹 식당 정보 수정
exports.updateRestaurant = async (req, res) => {
    try {
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 🔹 식당 삭제
exports.deleteRestaurant = async (req, res) => {
    try {
        await Restaurant.findByIdAndDelete(req.params.id);
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
