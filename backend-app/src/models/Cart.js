const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true }
});

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // MySQL User ID
    items: [cartItemSchema],
    status: { type: String, default: 'CART' }, // 🛒 CART 또는 PAID 등
    orderId: { type: String },
    customerName: { type: String },
    shippingAddress: { type: String },
    shippingPhone: { type: String },
    paymentMethod: { type: String },
    orderMemo: { type: String },
    totalAmount: { type: Number },
    couponId: { type: String },
    discountAmount: { type: Number, default: 0 },
    delivery_type: { type: String, default: 'HOME' },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);
