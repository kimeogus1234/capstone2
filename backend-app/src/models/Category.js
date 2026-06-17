const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    parentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        default: null 
    },
    level: {
        type: Number,
        required: true,
        enum: [1, 2, 3] // 1: Main, 2: Store Type, 3: Product Category
    },
    icon: { 
        type: String 
    },
    order: { 
        type: Number, 
        default: 0 
    },
    isGlobal: {
        type: Boolean,
        default: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
