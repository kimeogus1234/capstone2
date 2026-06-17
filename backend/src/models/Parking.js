const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
    zone: { type: String, required: true }, // e.g., "A", "B", "C"
    floor: { 
        type: String, 
        required: true,
        enum: ['B1', 'B2', 'B3']
    },
    totalSpaces: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['Available', 'Crowded', 'Full'],
        compute: function() {
            const ratio = this.currentOccupancy / this.totalSpaces;
            if (ratio < 0.6) return 'Available';
            if (ratio < 0.9) return 'Crowded';
            return 'Full';
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Parking', parkingSchema);
