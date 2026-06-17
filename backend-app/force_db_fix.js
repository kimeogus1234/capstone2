require('dotenv').config();
const User = require('./src/models/User');
const { sequelize } = require('./src/config/mysql');

async function forceSyncAndFix() {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL.');

        // 1. 테이블 구조 강제 업데이트 (email 컬럼 생성)
        await sequelize.sync({ alter: true });
        console.log('✅ MySQL Table schema updated (email column added).');

        // 2. 이메일 정보 업데이트
        // 사용자님이 아까 시도하셨던 아이디들을 모두 시도해봅니다.
        const targetUsernames = ['sjlee2649', 'lsj2649', 'ssjlee2649'];
        
        for (const username of targetUsernames) {
            const [updatedRows] = await User.update(
                { email: 'sjlee2649@naver.com' },
                { where: { username: username } }
            );
            if (updatedRows > 0) {
                console.log(`✅ Success! Email updated for user: ${username}`);
            }
        }

    } catch (error) {
        console.error('❌ Error during force sync/fix:', error);
    } finally {
        process.exit();
    }
}

forceSyncAndFix();
