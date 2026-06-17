const Parking = require('../models/Parking');

exports.getParkingStatus = async (req, res) => {
    try {
        const status = await Parking.find().sort({ zone: 1 });
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔹 관리자용: 특정 구역의 점유율 수정 (시뮬레이션용)
exports.updateParkingOccupancy = async (req, res) => {
    try {
        const { zone, floor, currentOccupancy } = req.body;
        const updated = await Parking.findOneAndUpdate(
            { zone, floor },
            { currentOccupancy },
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
