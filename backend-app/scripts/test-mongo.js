const dns = require('dns');
dns.setServers(['8.8.8.8']); // Google DNS
const mongoose = require('mongoose');

async function testConnection() {
    console.log('Testing Mongoose connection with forced DNS servers...');
    const uri = 'mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/test';
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Mongoose connected successfully!');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Mongoose selection failed:', err);
    }
}

testConnection();
