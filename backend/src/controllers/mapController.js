const FloorMap = require('../models/FloorMap');
const MapMarker = require('../models/MapMarker');

// 조회: 모든 층의 지도 정보와 해당 층의 마커들 가져오기
const getMaps = async (req, res) => {
    try {
        const floorMaps = await FloorMap.find();
        
        // 층 순서 정렬 (B3, B2, B1, 1F, 2F...)
        const sortedMaps = floorMaps.sort((a, b) => {
            const getRank = (f) => {
                if (!f || typeof f !== 'string') return 0;
                const match = f.match(/^([B]?)([0-9]+)/i);
                if (!match) return 0;
                const num = parseInt(match[2]);
                return match[1] ? -num : num;
            };
            return getRank(a.floor) - getRank(b.floor);
        });

        const allMarkers = await MapMarker.find().populate('storeId');
        
        const result = sortedMaps.map(m => {
            const mapObj = m.toObject();
            mapObj.markers = allMarkers.filter(marker => marker.floor === m.floor);
            return mapObj;
        });

        res.json(result); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 층 목록만 가져오기
const getFloors = async (req, res) => {
    try {
        const maps = await FloorMap.find({}, 'floor').lean();
        const floors = maps.map(m => m.floor).filter(Boolean).sort((a, b) => {
            const getRank = (f) => {
                if (!f || typeof f !== 'string') return 0;
                const match = f.match(/^([B]?)([0-9]+)/i);
                if (!match) return 0;
                const num = parseInt(match[2]);
                return match[1] ? -num : num;
            };
            return getRank(a) - getRank(b);
        });
        res.json(floors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 층 추가
const addFloor = async (req, res) => {
    try {
        const { floor } = req.body;
        const exists = await FloorMap.findOne({ floor });
        if (exists) return res.status(400).json({ message: '이미 존재하는 층입니다.' });
        
        const newFloor = new FloorMap({ floor });
        await newFloor.save();
        res.status(201).json(newFloor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 층 삭제 (마커 포함)
const deleteFloor = async (req, res) => {
    try {
        const { floor } = req.params;
        await FloorMap.findOneAndDelete({ floor });
        await MapMarker.deleteMany({ floor });
        res.json({ message: '층과 해당 마커들이 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 업데이트 또는 생성: 특정 층의 지도 이미지 설정
const updateMap = async (req, res) => {
    try {
        const { floor, imageUrl } = req.body;
        const map = await FloorMap.findOneAndUpdate(
            { floor },
            { imageUrl, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ message: '지도 정보가 업데이트되었습니다.', map });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 마커(NFC/QR 기반 위치 포인트) 생성 또는 업데이트
const createMarker = async (req, res) => {
    try {
        const { floor, label, x, y, tagId } = req.body;
        const marker = await MapMarker.create({ floor, label, x, y, tagId });
        res.status(201).json(marker);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 마커 정보 수정
const updateMarker = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMarker = await MapMarker.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedMarker);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 마커 일괄 삭제
const bulkDeleteMarkers = async (req, res) => {
    try {
        const { ids } = req.body;
        await MapMarker.deleteMany({ _id: { $in: ids } });
        res.json({ message: '마커들이 일괄 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 단일 마커 삭제
const deleteMarker = async (req, res) => {
    try {
        const { id } = req.params;
        await MapMarker.findByIdAndDelete(id);
        res.json({ message: '마커가 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 단일 마커 상세 조회 (NFC 태그나 마커 ID 기준 위치 조회용)
const getMarkerById = async (req, res) => {
    try {
        const { id } = req.params;
        const marker = await MapMarker.findById(id).populate('storeId');
        if (!marker) return res.status(404).json({ success: false, message: '마커를 찾을 수 없습니다.' });
        res.json({ success: true, marker });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { 
    getMaps, getFloors, addFloor, deleteFloor, updateMap, createMarker, 
    updateMarker, deleteMarker, bulkDeleteMarkers, getMarkerById
};
