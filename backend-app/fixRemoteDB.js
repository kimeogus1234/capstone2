require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || "mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(async () => {
    try {
        const ConditionalReward = require('./src/models/ConditionalReward');
        
        // 올바른 애플 매장 쿠폰 ID (coupons 컬렉션에 존재하는 실제 ID)
        const validCouponId = "69f98d15ac59f6b46bb3d364";
        
        const result = await ConditionalReward.updateMany(
            {}, 
            { $set: { 'reward.coupon_id': validCouponId } }
        );
        console.log('Fixed Database!', result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
