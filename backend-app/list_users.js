require('dotenv').config();
const User = require('./src/models/User');
const { sequelize } = require('./src/config/mysql');

async function listUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['id', 'username', 'email'] });
        console.log('👥 Current Users in DB:');
        users.forEach(u => console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`));
    } catch (error) {
        console.error('❌ Error listing users:', error);
    } finally {
        process.exit();
    }
}

listUsers();
