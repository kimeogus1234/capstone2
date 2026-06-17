const MapMarker = require('../models/MapMarker'); // MongoDB Model
const FloorMap = require('../models/FloorMap');

const getFloors = async (req, res) => {
    try {
        const markerFloors = await MapMarker.distinct('floor');
        const mapFloors = await FloorMap.distinct('floor');
        // 중복 제거 후 정렬
        const floors = [...new Set([...markerFloors, ...mapFloors])].sort();
        res.json({ success: true, floors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMarkers = async (req, res) => {
    try {
        const { floor } = req.query; // e.g. 'B1', '1F', '1P'
        if (!floor) return res.status(400).json({ message: 'Floor is required' });

        // 1. Get Floor Plan Image
        const floorData = await FloorMap.findOne({ floor });
        
        // 2. Get Markers for this floor
        const markers = await MapMarker.find({ floor }).populate('storeId');

        res.json({
            success: true,
            floor,
            floorPlanUrl: floorData ? floorData.imageUrl : null,
            markers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateFloorPlan = async (req, res) => {
    try {
        const { floor, imageUrl } = req.body;
        const updated = await FloorMap.findOneAndUpdate(
            { floor },
            { floor, imageUrl, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createMarker = async (req, res) => {
    try {
        const { floor, label, x, y, type, tagId } = req.body;
        const marker = await MapMarker.create({ floor, label, x, y, type, tagId });
        res.status(201).json({ success: true, data: marker });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateMarker = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await MapMarker.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Marker not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteMarker = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MapMarker.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Marker not found' });
        res.json({ success: true, message: 'Marker deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Slots logic can be integrated if needed, but for now focus on Basic Map
const assignSlot = async (req, res) => { res.status(501).json({ message: 'Not implemented for MongoDB yet' }); };
const removeSlot = async (req, res) => { res.status(501).json({ message: 'Not implemented for MongoDB yet' }); };

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
    getFloors,
    getMarkers,
    createMarker,
    updateMarker,
    deleteMarker,
    assignSlot,
    removeSlot,
    updateFloorPlan,
    getMarkerById
};
