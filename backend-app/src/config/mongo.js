const mongoose = require('mongoose');

const connectMongoDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00';
        await mongoose.connect(uri);
        console.log('MongoDB Connected.');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        // MongoDB is secondary, maybe don't exit process? adhering to requirements to use it for logs.
    }
};

module.exports = { connectMongoDB };
