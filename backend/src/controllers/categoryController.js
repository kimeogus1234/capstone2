const Category = require('../models/Category');

exports.getTree = async (req, res) => {
    try {
        const storeId = req.query.storeId || req.user?.assignedStoreId;
        const all = await Category.find({}).sort({ order: 1 });
        
        // 1. 관리자 뷰 (전체 트리)
        if (req.user?.role === 'ADMIN' && !req.query.storeId) {
            const buildFullTree = (pId = null) => {
                return all
                    .filter(c => String(c.parentId || null) === String(pId || null))
                    .map(c => ({ ...c._doc, children: buildFullTree(c._id) }));
            };
            return res.json(all.filter(c => c.level === 1).map(m => ({ ...m._doc, children: buildFullTree(m._id) })));
        }

        // 2. 매장/직원 뷰 (필터링된 트리)
        if (storeId) {
            const Store = require('../models/Store');
            const store = await Store.findById(storeId);
            
            // 💡 [개선] 매장에 카테고리가 없더라도 관리자(ADMIN)라면 전체 목록을 보여줍니다.
            if (!store || !store.categories || store.categories.length === 0) {
                if (req.user?.role === 'ADMIN') {
                    const buildFullTree = (pId = null) => {
                        return all
                            .filter(c => String(c.parentId || null) === String(pId || null))
                            .map(c => ({ ...c._doc, children: buildFullTree(c._id) }));
                    };
                    return res.json(all.filter(c => c.level === 1).map(m => ({ ...m._doc, children: buildFullTree(m._id) })));
                }
                return res.json([]);
            }

            const allowedIds = new Set();
            const storeCatIds = store.categories.map(id => id.toString());

            // 🔹 1단계: 매장에 설정된 카테고리(L2)와 그 자식(L3)들 찾기
            storeCatIds.forEach(id => {
                allowedIds.add(id);
                // 자식(L3) 추가
                all.filter(c => String(c.parentId) === id).forEach(child => allowedIds.add(child._id.toString()));
                
                // 조상(L1) 추가
                let curr = all.find(c => c._id.toString() === id);
                if (curr && curr.parentId) {
                    allowedIds.add(curr.parentId.toString());
                }
            });

            // 🔹 2단계: 트리 구성
            const buildFilteredTree = (pId = null) => {
                return all
                    .filter(c => String(c.parentId || null) === String(pId || null) && allowedIds.has(c._id.toString()))
                    .map(c => ({
                        ...c._doc,
                        children: buildFilteredTree(c._id)
                    }))
                    .filter(c => c.level === 3 || c.children.length > 0);
            };

            const result = buildFilteredTree(null);
            return res.json(result);
        }

        res.json([]);
    } catch (error) {
        console.error('getTree Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// 나머지 컨트롤러 함수들 (getCategories, createCategory 등)은 그대로 유지하거나 필요한 부분만 보강
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ order: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        const category = new Category({ ...req.body, isGlobal: true });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        const children = await Category.countDocuments({ parentId: req.params.id });
        if (children > 0) return res.status(400).json({ message: '하위 카테고리가 있습니다.' });
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
