const mongoose = require('mongoose');
const Promotion = require('./src/models/Promotion');
require('dotenv').config();

const promotions = [
    {
        _id: "69ef2391c82a897b19c9e62e",
        title: "마당M 그랜드 오프닝 페스티벌",
        description: "전 매장 최대 50% 할인 및 경품 증정",
        startDate: "2026-04-27T08:51:29.154Z",
        endDate: "2026-05-04T08:51:29.154Z",
        type: "Promotion",
        isActive: true
    },
    {
        _id: "69ef2391c82a897b19c9e62f",
        title: "나이키 써머 런닝 세션",
        description: "나이키와 함께하는 도심 러닝 이벤트",
        startDate: "2026-04-27T08:51:29.154Z",
        endDate: "2026-04-30T08:51:29.154Z",
        storeId: "69ef2391c82a897b19c9e629",
        type: "Promotion",
        isActive: true
    },
    {
        _id: "69ef807ea6c7fe9bad2beeb3",
        title: "SADASD",
        description: "ADASDASDASD",
        startDate: "2026-04-10T00:00:00.000Z",
        endDate: "2026-05-01T00:00:00.000Z",
        storeId: "69ef2391c82a897b19c9e628",
        bannerUrl: "",
        type: "Promotion",
        isActive: true
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartstore');
        console.log('Connected to MongoDB');

        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 30);

        const updatedPromotions = promotions.map(p => ({
            ...p,
            startDate: now,
            endDate: future
        }));

        for (const promo of updatedPromotions) {
            await Promotion.findByIdAndUpdate(promo._id, promo, { upsert: true, new: true });
        }

        console.log('Promotions seeded successfully (Dates adjusted to be active)');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding promotions:', error);
        process.exit(1);
    }
}

seed();
