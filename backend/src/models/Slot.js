const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    slot_number: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'IN_CART', 'PAID', 'DELIVERING', 'COMPLETED'],
        default: 'AVAILABLE'
    },
    price: {
        type: Number,
        default: null
    },
    lock_expires_at: {
        type: Date,
        default: null
    },
    product_id: {
        type: String, // Storing MongoDB ObjectId as string or use mongoose.Schema.Types.ObjectId
        default: null
    },
    current_user_id: {
        type: Number, // Reference to MySQL User ID
        default: null
    },
    markerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MapMarker',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);
