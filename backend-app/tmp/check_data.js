const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

/** 📡 [Premium Recon] 친구분이 쓰시는 데이터 필드명 확인 작전 */
async function checkData() {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) throw new Error('MONGO_URI가 없습니다.');

        console.log('📡 아틀라스에 긴급 접속 중...');
        await mongoose.connect(mongoURI);
        console.log('✅ 접속 성공! 실제 데이터 스캔 시작...');

        const Product = mongoose.connection.collection('products');

        // 🐟 신선식품(B타입) 중 하나를 가져와서 필드를 살펴봅니다!
        const product = await Product.findOne({ display_template: "B" });

        if (product) {
            console.log('\n🏆 [친구분이 넣으신 상품 발견!]\n');
            console.log(JSON.stringify(product, null, 2));

            if (product.variants && product.variants.length > 0) {
                console.log('\n📦 [변동제 상세 속성(Variants)]');
                console.log(Object.keys(product.variants[0]));
            }
        } else {
            console.log('ℹ️ 아직 Template B(고등어 등) 데이터가 없습니다.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ [ERROR]:', err.message);
        process.exit(1);
    }
}

checkData();
