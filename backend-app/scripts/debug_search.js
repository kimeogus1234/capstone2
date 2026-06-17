require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongoDB } = require('./src/config/mongo');
const Product = require('./src/models/ProductMongo');
const Category = require('./src/models/Category');

connectMongoDB().then(async () => {
    try {
        const queryName = '스마트폰';
        const categories = await Category.find({ name: { $regex: queryName, $options: 'i' } });
        const categoryIds = categories.map(cat => cat._id.toString());
        console.log('Found category IDs:', categoryIds);

        const filter = {
            $or: [
                { category: { $in: categoryIds } },
                { categoryId: { $in: categoryIds } },
                { category: { $regex: queryName, $options: 'i' } },
                { categoryId: { $regex: queryName, $options: 'i' } },
                { name: { $regex: queryName, $options: 'i' } }
            ]
        };
        console.log('Query filter:', JSON.stringify(filter, null, 2));

        const products = await Product.find(filter).lean();
        console.log('Products returned:', products.map(p => p.name));
        
        // Let's also check the actual iPhone product in DB right now
        const iphone = await Product.findOne({ name: { $regex: '아이폰' } }).lean();
        console.log('Current iPhone category field:', iphone.category);
        console.log('Current iPhone categoryId field:', iphone.categoryId);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
