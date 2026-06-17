const mongoose = require('mongoose');
const Store = require('./src/models/Store');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00');
        console.log('Connected to MongoDB');

        const stores = await Store.find();
        console.log('Stores found:', stores.length);
        if (stores.length > 0) {
            console.log('Sample Store:', stores[0]);
        } else {
            console.log('No stores found in "stores" collection.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

check();
