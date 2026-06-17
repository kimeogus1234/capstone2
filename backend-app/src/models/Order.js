const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true },
    variant_info: { type: String }
});

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // MySQL User ID (stringified)
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'CANCEL_REQUESTED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED', 'EXCHANGED'],
        default: 'PAID' 
    },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String },
    orderMemo: { type: String },
    orderId: { type: String },
    customerName: { type: String },
    contact: { type: String },
    delivery_type: { type: String, default: 'HOME' }
}, { 
    timestamps: true,
    collection: 'carts' 
});

module.exports = mongoose.model('Order', OrderSchema, 'carts'); 
