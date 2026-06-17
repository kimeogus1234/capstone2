const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || "mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(async () => {
    try {
        const Cart = require('./src/models/Cart');
        const counts = await Cart.aggregate([
            { $match: { status: { $ne: 'CART' } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('Order counts in DB:', counts);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
