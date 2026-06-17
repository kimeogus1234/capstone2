const Category = require('../models/Category');

// [소비자용] 카테고리 트리 조회 (계층형)
exports.getTree = async (req, res) => {
    try {
        const all = await Category.find({}).sort({ order: 1 });
        
        // 계층별 트리 빌더 (소비자용이므로 전체 트리를 구성)
        const buildFullTree = (pId = null) => {
            return all
                .filter(c => String(c.parentId || null) === String(pId || null))
                .map(c => ({ 
                    ...c._doc, 
                    children: buildFullTree(c._id) 
                }));
        };

        const tree = all
            .filter(c => c.level === 1)
            .map(m => ({ 
                ...m._doc, 
                children: buildFullTree(m._id) 
            }));

        res.json(tree);
    } catch (error) {
        console.error('getTree Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// [소비자용] 단순 카테고리 리스트 조회 (평면 구조)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ level: 1, order: 1 });
        // 앱 프론트엔드 규격에 맞춰 다이렉트 배열 반환
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 특정 부모 하위 카테고리 조회
exports.getSubCategories = async (req, res) => {
    try {
        const { parentId } = req.params;
        const subCategories = await Category.find({ parentId }).sort({ order: 1 });
        res.json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
