const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/mysql');
const { connectMongoDB } = require('../config/mongo');
const CouponMySQL = require('../models/Coupon');
const CouponMongo = require('../models/CouponMongo');

async function migrate() {
    try {
        console.log('--- 쿠폰 데이터 마이그레이션 시작 ---');
        
        // DB 연결
        await connectMongoDB();
        console.log('MongoDB 연결 성공');

        // MySQL 데이터 조회
        const mysqlCoupons = await CouponMySQL.findAll();
        console.log(`MySQL에서 ${mysqlCoupons.length}개의 쿠폰을 발견했습니다.`);

        if (mysqlCoupons.length === 0) {
            console.log('마이그레이션할 데이터가 없습니다.');
            process.exit(0);
        }

        let successCount = 0;
        let failCount = 0;

        for (const mysqlCoupon of mysqlCoupons) {
            try {
                // 이미 존재하는지 확인 (코드 기준)
                const exists = await CouponMongo.findOne({ code: mysqlCoupon.code.toUpperCase() });
                
                if (!exists) {
                    await CouponMongo.create({
                        name: mysqlCoupon.name,
                        code: mysqlCoupon.code.toUpperCase(),
                        discount_type: mysqlCoupon.discount_type,
                        discount_value: mysqlCoupon.discount_value,
                        min_order_amount: mysqlCoupon.min_order_amount,
                        max_discount_amount: mysqlCoupon.max_discount_amount,
                        valid_from: mysqlCoupon.valid_from,
                        valid_until: mysqlCoupon.valid_until,
                        is_active: mysqlCoupon.is_active,
                        createdAt: mysqlCoupon.createdAt,
                        updatedAt: mysqlCoupon.updatedAt
                    });
                    successCount++;
                } else {
                    console.log(`[중복 건너뜀] 코드: ${mysqlCoupon.code}`);
                    failCount++;
                }
            } catch (err) {
                console.error(`[오류] 코드 ${mysqlCoupon.code}:`, err.message);
                failCount++;
            }
        }

        console.log('--- 마이그레이션 완료 ---');
        console.log(`성공: ${successCount}건`);
        console.log(`건너뜀/실패: ${failCount}건`);
        
        process.exit(0);
    } catch (error) {
        console.error('마이그레이션 중 치명적 오류 발생:', error);
        process.exit(1);
    }
}

migrate();
