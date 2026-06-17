const mongoose = require('mongoose');
require('dotenv').config();

const uri = "mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00";

const Restaurant = require('./src/models/Restaurant');
const Menu = require('./src/models/Menu');

async function check() {
    await mongoose.connect(uri);
    const restaurants = await Restaurant.find();
    const menus = await Menu.find().populate('restaurantId');
    console.log(`Restaurants found: ${restaurants.length}`);
    console.log(`Menus found: ${menus.length}`);
    if (menus.length > 0) {
        console.log('Sample Menu:', menus[0].name, 'Restaurant:', menus[0].restaurantId?.name);
    }
    process.exit(0);
}
check();
