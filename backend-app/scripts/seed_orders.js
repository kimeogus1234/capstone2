require('dotenv').config();
const { sequelize } = require('./src/config/mysql');
const { connectMongoDB } = require('./src/config/mongo');
const User = require('./src/models/User');
const MongoProduct = require('./src/models/ProductMongo');
const { Order, OrderItem } = require('./src/models/Order');

async function seed() {
    try {
        await connectMongoDB();
        await sequelize.authenticate();
        console.log('Connected to databases.');

        // 1. Find or create a test user
        let user = await User.findOne({ where: { username: 'testuser' } });
        if (!user) {
            user = await User.findOne(); // Get any user if testuser doesn't exist
        }

        if (!user) {
            console.log('No users found. Please create a user first.');
            process.exit(1);
        }

        console.log(`Using user: ${user.username} (ID: ${user.id})`);

        // 2. Find a product
        const product = await MongoProduct.findOne();
        if (!product) {
            console.log('No products found in MongoDB. Please add a product first.');
            process.exit(1);
        }
        console.log(`Using product: ${product.name} (ID: ${product._id})`);

        // 3. Ensure user has enough mileage
        user.mileage = (user.mileage || 0) + 100000;
        await user.save();

        // 4. Create Test Orders
        const statuses = ['PAID', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

        for (let i = 0; i < 5; i++) {
            const status = statuses[i % statuses.length];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const total_amount = product.price * quantity;

            const order = await Order.create({
                user_id: user.id,
                total_amount: total_amount,
                status: status
            });

            await OrderItem.create({
                order_id: order.id,
                price: product.price,
                quantity: quantity,
                mongo_product_id: product._id.toString(),
                product_name: product.name
            });

            console.log(`Created order #${order.id} with status ${status}`);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
