const Store = require('../models/Store');
const Product = require('../models/Product');
const User = require('../models/User');
const MapMarker = require('../models/MapMarker');

// 🔹 모든 매장 조회 (페이지네이션 및 필터링 포함)
exports.getAllStores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { category, floor, search, type } = req.query;
        
        let query = {};
        let conditions = [];

        // 1. 타입 필터링
        if (type) {
            if (type === 'STORE') {
                conditions.push({ $or: [{ type: 'STORE' }, { type: { $exists: false } }] });
            } else {
                conditions.push({ type });
            }
        }

        // 2. 카테고리 필터링
        if (category) {
            conditions.push({ categories: { $in: [category] } });
        }
        
        // 3. 층별 필터링
        if (floor) {
            conditions.push({ floor });
        }

        // 4. 검색어 필터링 (인덱스 활용)
        if (search) {
            conditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { locationCode: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ]
            });
        }

        if (conditions.length > 0) {
            query = { $and: conditions };
        }

        const totalCount = await Store.countDocuments(query);
        const stores = await Store.find(query)
            .populate('categories')
            .sort({ floor: 1, name: 1 })
            .limit(limit)
            .skip(skip);

        res.json({
            stores,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 특정 매장 상세 조회
exports.getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('categories');
        if (!store) return res.status(404).json({ message: 'Store not found' });
        res.json(store);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 매장 등록
exports.createStore = async (req, res) => {
    try {
        if (!req.body.markerId || req.body.markerId === 'null' || req.body.markerId === 'undefined' || req.body.markerId === '') {
            req.body.markerId = null;
        }
        if (req.body.mapX === '' || req.body.mapX === 'null' || req.body.mapX === undefined) req.body.mapX = null;
        if (req.body.mapY === '' || req.body.mapY === 'null' || req.body.mapY === undefined) req.body.mapY = null;

        const store = new Store(req.body);
        const newStore = await store.save();

        // 💡 연동된 지도 마커(MapMarker)가 있다면 해당 마커에 storeId를 상호 업데이트합니다.
        if (newStore.markerId) {
            await MapMarker.findByIdAndUpdate(newStore.markerId, { storeId: newStore._id });
        } else if (newStore.mapX !== null && newStore.mapY !== null) {
            // markerId는 지정을 안 했는데 좌표(mapX, mapY)만 찍어서 저장한 경우 -> MapMarker 자동 생성 및 상호 연동
            const newMarker = await MapMarker.create({
                floor: newStore.floor,
                label: newStore.name,
                x: newStore.mapX,
                y: newStore.mapY,
                type: 'STORE',
                storeId: newStore._id
            });
            newStore.markerId = newMarker._id;
            await newStore.save();
        }

        res.status(201).json(newStore);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 🔹 매장 정보 수정
exports.updateStore = async (req, res) => {
    try {
        if (!req.body.markerId || req.body.markerId === 'null' || req.body.markerId === 'undefined' || req.body.markerId === '') {
            req.body.markerId = null;
        }
        if (req.body.mapX === '' || req.body.mapX === 'null' || req.body.mapX === undefined) req.body.mapX = null;
        if (req.body.mapY === '' || req.body.mapY === 'null' || req.body.mapY === undefined) req.body.mapY = null;

        // 1. 기존 매장 정보 조회 (마커 상호 연결 변경 감지용)
        const oldStore = await Store.findById(req.params.id);
        const updatedStore = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // 2. 마커 상호 동기화 진행
        // 기존에 지정되었던 마커가 있었는데, 새로운 마커로 바뀌거나 해제된 경우 기존 마커의 storeId를 null로 초기화
        if (oldStore && oldStore.markerId && oldStore.markerId.toString() !== (updatedStore.markerId ? updatedStore.markerId.toString() : '')) {
            await MapMarker.findByIdAndUpdate(oldStore.markerId, { storeId: null });
        }

        // 새로운 마커가 지정된 경우, 해당 마커에 storeId 연결 및 좌표/라벨 동기화
        if (updatedStore.markerId) {
            await MapMarker.findByIdAndUpdate(updatedStore.markerId, { 
                storeId: updatedStore._id,
                x: updatedStore.mapX,
                y: updatedStore.mapY,
                label: updatedStore.name,
                floor: updatedStore.floor
            });
        } else if (updatedStore.mapX !== null && updatedStore.mapY !== null) {
            // markerId는 지정 안 됐으나 좌표 정보가 들어온 경우
            if (oldStore && oldStore.markerId) {
                // 기존 연결된 마커가 있었다면 새로 만들지 않고 기존 마커 업데이트
                await MapMarker.findByIdAndUpdate(oldStore.markerId, {
                    floor: updatedStore.floor,
                    label: updatedStore.name,
                    x: updatedStore.mapX,
                    y: updatedStore.mapY,
                    storeId: updatedStore._id
                });
                updatedStore.markerId = oldStore.markerId;
                await updatedStore.save();
            } else {
                // 기존 마커도 없었다면 -> MapMarker 신규 생성 및 연결
                const newMarker = await MapMarker.create({
                    floor: updatedStore.floor,
                    label: updatedStore.name,
                    x: updatedStore.mapX,
                    y: updatedStore.mapY,
                    type: 'STORE',
                    storeId: updatedStore._id
                });
                updatedStore.markerId = newMarker._id;
                await updatedStore.save();
            }
        }

        res.json(updatedStore);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 🔹 매장 삭제 프리뷰 조회 (삭제될 상품/직원 미리보기)
exports.getDeletePreview = async (req, res) => {
    try {
        const storeId = req.params.id;
        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ message: 'Store not found' });

        // 1. 매장에 속한 상품 목록 조회
        const products = await Product.find({ storeId }).select('name base_price');

        // 2. 매장에 소속된 직원 목록 조회 (MySQL)
        const staff = await User.findAll({
            where: { assignedStoreId: storeId, role: 'STAFF' },
            attributes: ['id', 'username', 'name']
        });

        res.json({
            storeName: store.name,
            products,
            staff
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 매장 삭제 (종속 상품 및 직원 일괄 연쇄 삭제)
exports.deleteStore = async (req, res) => {
    try {
        const storeId = req.params.id;
        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ message: 'Store not found' });

        // 💡 매장에 연결되었던 지도 마커(MapMarker)의 storeId 연결 해제
        if (store.markerId) {
            await MapMarker.findByIdAndUpdate(store.markerId, { storeId: null });
        }

        // 1. 매장에 종속된 MongoDB 상품 일괄 삭제
        const deleteProductsResult = await Product.deleteMany({ storeId });

        // 2. 매장에 종속된 MySQL 직원 계정 일괄 삭제
        const deleteStaffResult = await User.destroy({
            where: { assignedStoreId: storeId }
        });

        // 3. 매장 자체 삭제
        await Store.findByIdAndDelete(storeId);

        res.json({ 
            message: 'Store and all associated products and staff deleted successfully',
            deletedProductsCount: deleteProductsResult.deletedCount,
            deletedStaffCount: deleteStaffResult
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
