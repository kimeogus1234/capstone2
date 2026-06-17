const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || "mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00";

mongoose.connect(uri).then(async () => {
    try {
        const Product = require('./src/models/ProductMongo');
        const Category = require('./src/models/Category');
        const pCount = await Product.countDocuments();
        const cCount = await Category.countDocuments();
        console.log('--- DB Content Status ---');
        console.log('MongoDB Products:', pCount);
        console.log('MongoDB Categories:', cCount);
        
        if (pCount > 0) {
            const sample = await Product.findOne();
            console.log('Sample Product Name:', sample.name);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
