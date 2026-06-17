require('dotenv').config();
const { connectMongoDB } = require('./src/config/mongo');
const Category = require('./src/models/Category');

connectMongoDB().then(async () => {
  const items = ['선풍기', '밴드기저귀', '미분류', '대게', '라면', '전자레인지', '번외메뉴'];
  const res = await Category.deleteMany({ name: { $in: items } });
  console.log('삭제 결과:', res);
  process.exit(0);
}).catch(console.error);
