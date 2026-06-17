const mongoose = require('mongoose');
const Coupon = require('./src/models/Coupon');
require('dotenv').config();

const MONGO_URI = 'mongodb://localhost:27017/a00';

const sampleCoupons = [
    {
        name: "ㅁㄴㅇ",
        code: "ㅁㄴㅇㅁ",
        discount_type: "AMOUNT",
        discount_value: 123123,
        min_order_amount: 312323,
        max_discount_amount: null,
        valid_from: new Date("2026-05-26T00:00:00.000Z"),
        valid_until: new Date("2026-06-05T00:00:00.000Z"),
        is_active: true
    },
    {
        name: "쿠폰",
        code: "12313",
        discount_type: "AMOUNT",
        discount_value: 123,
        min_order_amount: 33333,
        max_discount_amount: null,
        valid_from: new Date("2026-05-29T00:00:00.000Z"),
        valid_until: new Date("2026-06-04T00:00:00.000Z"),
        is_active: true
    },
    {
        name: "마당M 웰컴 쿠폰",
        code: "WELCOME2026",
        discount_type: "AMOUNT",
        discount_value: 5000,
        min_order_amount: 30000,
        max_discount_amount: null,
        valid_from: new Date(),
        valid_until: new Date("2026-12-31"),
        is_active: true
    },
    {
        name: "오픈 기념 10% 할인권",
        code: "GRANDOPEN",
        discount_type: "PERCENTAGE",
        discount_value: 10,
        min_order_amount: 10000,
        max_discount_amount: 20000,
        valid_from: new Date(),
        valid_until: new Date("2026-06-30"),
        is_active: true
    }
];

async function seedCoupons() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // 기존 샘플 데이터 삭제 (중복 방지)
        await Coupon.deleteMany({});
        
        // 새 데이터 삽입
        await Coupon.insertMany(sampleCoupons);
        
        console.log('Coupons seeded successfully! (Original test data included)');
        process.exit();
    } catch (error) {
        console.error('Error seeding coupons:', error);
        process.exit(1);
    }
}

seedCoupons();
