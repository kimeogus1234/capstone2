const mongoose = require('mongoose');
const uri = "mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00";

async function findRealCollections() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('--- [DB Collections List] ---');
    collections.forEach(c => console.log(`📌 ${c.name}`));
    
    // 각 컬렉션에 데이터가 몇개씩 들어있는지도 확인
    for(let c of collections) {
        const count = await db.collection(c.name).countDocuments();
        console.log(`📊 ${c.name}: ${count} docs`);
    }
    process.exit(0);
}
findRealCollections();
