const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' }, // Optional link to a specific store
    bannerUrl: { type: String },
    type: { 
        type: String, 
        enum: ['Promotion', 'Exhibition', 'Concert', 'Opening', 'Season Off'],
        default: 'Promotion'
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
