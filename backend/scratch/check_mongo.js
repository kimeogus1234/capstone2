const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        
        const count = await Product.countDocuments();
        console.log(`📊 현재 연결된 DB의 상품 개수: ${count}개`);
        
        if (count > 0) {
            const sample = await Product.findOne();
            console.log(`📝 샘플 데이터 (매장 ID 확인):`, sample.storeId);
        }
        
        await mongoose.connection.close();
    } catch (e) {
        console.error('❌ 연결 에러:', e.message);
    }
}

checkData();
