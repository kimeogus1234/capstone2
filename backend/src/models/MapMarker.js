const mongoose = require('mongoose');

const mapMarkerSchema = new mongoose.Schema({
    floor: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    tagId: {
        type: String,
        default: null
    },
    type: {
        type: String,
        enum: ['STORE', 'NFC', 'QR'],
        default: 'STORE',
        required: true
    },
    x: {
        type: Number, // Percentage 0-100
        required: true
    },
    y: {
        type: Number, // Percentage 0-100
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MapMarker', mapMarkerSchema);
