const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugDB() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        console.log('✅ MongoDB Connected');
        
        const db = client.db('a00'); // 데이터베이스 명시
        const collections = await db.listCollections().toArray();
        console.log('📂 현재 존재하는 컬렉션들:', collections.map(c => c.name));
        
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- [${col.name}] 컬렉션 데이터 수: ${count}개`);
            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log(`  (샘플 데이터 ID: ${sample._id}, OrderId: ${sample.orderId || '없음'})`);
            }
        }
    } catch (e) {
        console.error('❌ 에러:', e.message);
    } finally {
        await client.close();
    }
}

debugDB();
