require('dotenv').config();
const User = require('./src/models/User'); // 경로 수정
const { sequelize } = require('./src/config/mysql');

async function fixUserEmail() {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL.');

        // 유저 정보 업데이트 (아이디: sjlee2649)
        const [updatedRows] = await User.update(
            { email: 'sjlee2649@naver.com' },
            { where: { username: 'sjlee2649' } }
        );

        if (updatedRows > 0) {
            console.log('✅ Success! Email updated for user sjlee2649.');
        } else {
            console.warn('⚠️ User sjlee2649 not found or email already set.');
        }

    } catch (error) {
        console.error('❌ Error updating email:', error);
    } finally {
        process.exit();
    }
}

fixUserEmail();
