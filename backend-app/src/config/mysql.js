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

// 커넥션 생성 시 세션 sql_mode 해제 훅 추가 (Incorrect datetime value: '0000-00-00 00:00:00' 에러 방지)
sequelize.addHook('afterConnect', (connection, config) => {
    return new Promise((resolve, reject) => {
        connection.query("SET SESSION sql_mode = ''", (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
});

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
