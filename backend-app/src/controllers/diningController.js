const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');

/**
 * 🍽️ 다이닝(음식점/메뉴) 컨트롤러
 */
const diningController = {
    // 🏢 모든 음식점 조회
    getRestaurants: async (req, res) => {
        try {
            console.log("🏢 [Dining API] Get Restaurants 요청");
            const restaurants = await Restaurant.find().sort({ floor: 1, name: 1 });
            res.json(restaurants);
        } catch (error) {
            console.error("❌ Restaurant Fetch Error:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // 🍱 특정 음식점의 메뉴 조회
    getMenus: async (req, res) => {
        try {
            const { restaurantId } = req.params;
            console.log(`🍱 [Dining API] Get Menus 요청 (ID: ${restaurantId || 'All'})`);
            const query = restaurantId ? { restaurantId } : {};
            const menus = await Menu.find(query).populate('restaurantId');
            res.json(menus);
        } catch (error) {
            console.error("❌ Menu Fetch Error:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // ✨ 추천 메뉴/음식점 조회 (메인용)
    getHighlights: async (req, res) => {
        try {
            console.log("🍽️ [Dining API] Highlights 요청 수신 시작");
            
            // 🛡️ 데이터가 없을 경우를 대비해 빈 배열 보장
            // 🛡️ 필터를 제거하여 데이터가 1개만 있더라도 무조건 가져오도록 수정
            const popularRestaurants = await Restaurant.find().limit(5) || [];
            const recommendedMenus = await Menu.find().populate('restaurantId').limit(10) || [];
            
            console.log(`📊 [Dining API] 결과 성공: 음식점 ${popularRestaurants.length}개, 메뉴 ${recommendedMenus.length}개`);
            
            // JSON 응답을 명시적으로 반환
            return res.status(200).json({
                success: true,
                restaurants: popularRestaurants,
                menus: recommendedMenus
            });
        } catch (error) {
            console.error("❌ [Dining API CRITICAL ERROR]:", error);
            return res.status(500).json({ 
                success: false,
                message: error.message || "Internal Server Error" 
            });
        }
    }
};

module.exports = diningController;
