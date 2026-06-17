require('dotenv').config();
const User = require('./src/models/User');
const { sequelize } = require('./src/config/mysql');
const { Op } = require('sequelize');

async function cleanUpUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL.');

        // 카카오 ID가 없는(null) 사용자만 삭제
        const deletedCount = await User.destroy({
            where: {
                kakaoId: { [Op.is]: null }
            }
        });

        console.log(`✅ Success! ${deletedCount} general users have been deleted.`);
        console.log('👑 Kakao users were preserved.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        process.exit();
    }
}

cleanUpUsers();
