require('dotenv').config();
const mongoose = require('mongoose');
const { connectMongoDB } = require('./src/config/mongo');
const Product = require('./src/models/ProductMongo');
const Category = require('./src/models/Category');

connectMongoDB().then(async () => {
    try {
        const categories = await Category.find();
        const catMap = {};
        categories.forEach(c => {
            catMap[c._id.toString()] = c.name;
        });

        const products = await Product.find({}, 'name category categoryId').lean();
        console.log('=== Product Category Mapping ===');
        products.forEach(p => {
            const catIds = p.category || [];
            let catNames = catIds.map(id => catMap[id.toString()] || `Unknown(ID:${id})`);
            let singleCatName = p.categoryId ? (catMap[p.categoryId.toString()] || `Unknown(ID:${p.categoryId})`) : 'None';
            console.log(`- 상품명: ${p.name}`);
            console.log(`  배열카테고리: ${catNames.join(', ')}`);
            console.log(`  단일카테고리: ${singleCatName}\n`);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
