const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 🧬 [Path Fixed] 현재 파일 위치 기준으로 한 단계 위(.env)를 정확히 찾아갑니다.
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function fixIndex() {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) throw new Error(`MONGO_URI가 없습니다. (경로: ${envPath})`);

        console.log('📡 아틀라스 긴급 접속 중...');
        await mongoose.connect(mongoURI);
        console.log('✅ 접속 성공!');

        const Cart = mongoose.connection.collection('carts');

        try {
            // 🔥 [Target] userId_1 유니크 인덱스 제거
            await Cart.dropIndex('userId_1');
            console.log('🏆 [SUCCESS] userId_1 중복 제약을 완전히 철거했습니다!');
        } catch (e) {
            console.log('ℹ️ 이미 제약이 없거나 삭제되었습니다.');
        }

        console.log('✨ 이제 장바구니에 자유롭게 담으세요!');
        process.exit(0);
    } catch (err) {
        console.error('❌ [ERROR]:', err.message);
        process.exit(1);
    }
}

fixIndex();
