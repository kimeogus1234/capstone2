require('dotenv').config();
const { sequelize } = require('./src/config/mysql');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connected successfully.');

        // 1234 패스워드를 bcrypt 해싱합니다.
        const passwordHash = await bcrypt.hash('1234', 10);

        // 기존에 testuser가 있는지 확인하고 없으면 생성, 있으면 패스워드 업데이트
        const [user, created] = await User.findOrCreate({
            where: { username: 'testuser' },
            defaults: {
                username: 'testuser',
                password: passwordHash,
                name: '테스트유저',
                email: 'testuser@example.com',
                birthYear: '1995',
                role: 'CUSTOMER',
                mileage: 5000,
                phone: '010-1234-5678',
                addresses: []
            }
        });

        if (created) {
            console.log('🎉 [성공] testuser 계정이 정상적으로 생성되었습니다!');
            console.log('👤 아이디: testuser');
            console.log('🔑 비밀번호: 1234');
            console.log('💰 보너스 마일리지: 5,000원 적립 완료!');
        } else {
            // 이미 존재하면 비밀번호를 1234로 초기화/업데이트
            user.password = passwordHash;
            await user.save();
            console.log('🔄 [성공] 이미 존재하는 testuser 계정의 비밀번호를 1234로 성공적으로 재설정했습니다!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ [에러] 계정 생성 중 오류 발생:', error);
        process.exit(1);
    }
}

createTestUser();
