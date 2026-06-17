const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

/** 📡 [Premium Verification] 변동제 상품의 is_sold 상태 실시간 판독 */
async function verify() {
    try {
        const mongoURI = process.env.MONGO_URI;
        await mongoose.connect(mongoURI);

        const Product = mongoose.connection.collection('products');

        // 🐟 사용자님의 스크린샷 속 상품을 찾아봅니다!
        const product = await Product.findOne({ name: /변동제/ });

        if (product) {
            console.log(`\n🏆 [상품명: ${product.name}]`);
            product.variants.forEach(v => {
                const status = v.is_sold === true ? '🔴 [누군가 장바구니에 담음 - TRUE]' : '🟢 [현재 상점에 있음 - FALSE]';
                console.log(`${v.product_number}번 상품: ${status} | 이름표: is_sold`);
            });
        } else {
            console.log('ℹ️ 변동제 상품을 찾을 수 없습니다.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ [ERROR]:', err.message);
        process.exit(1);
    }
}

verify();
