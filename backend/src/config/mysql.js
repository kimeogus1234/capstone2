const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'smart_store',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

const connectMySQL = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Connected.');
    } catch (error) {
        console.error('MySQL Connection Error:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectMySQL };
