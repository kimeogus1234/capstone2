const mongoose = require('mongoose');

const connectMongoDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_store_logs';
        await mongoose.connect(uri, {
            dbName: 'a00' // 데이터베이스 이름을 'a00'으로 확실히 고정
        });
        console.log('MongoDB Connected.');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        // MongoDB is secondary, maybe don't exit process? adhering to requirements to use it for logs.
    }
};

module.exports = { connectMongoDB };
