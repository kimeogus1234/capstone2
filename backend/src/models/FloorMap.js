const mongoose = require('mongoose');

const floorMapSchema = new mongoose.Schema({
    floor: {
        type: String,
        required: true,
        unique: true // '1F', 'B1' etc
    },
    imageUrl: {
        type: String,
        required: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FloorMap', floorMapSchema);
