require('dotenv').config();
const { connectMongoDB } = require('./src/config/mongo');
const Product = require('./src/models/ProductMongo'); // Use the correct product model
const Category = require('./src/models/Category');

connectMongoDB().then(async () => {
  const products = await Product.find({ name: { $regex: '아이폰', $options: 'i' } });
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}).catch(console.error);
