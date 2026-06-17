const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || "mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00";

const Restaurant = require('./src/models/Restaurant');
const Menu = require('./src/models/Menu');

const seedData = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for seeding dining data...');

        // 1. 기존 데이터 삭제 (🚫 경고: 데이터 보존을 위해 주석 처리함)
        // await Restaurant.deleteMany({});
        // await Menu.deleteMany({});

        // 2. 음식점 데이터 생성
        const restaurants = await Restaurant.create([
            {
                name: '마당 정식',
                floor: '1F',
                locationCode: 'A-101',
                description: '정갈한 한식 한 상 차림',
                hours: '11:00 - 21:00',
                imageUrl: 'https://images.unsplash.com/photo-1553163147-622820be2931?auto=format&fit=crop&w=600&q=80',
                isPopular: true,
                cuisineType: '한식'
            },
            {
                name: '루프탑 테라스',
                floor: 'RF',
                locationCode: 'R-01',
                description: '최고의 뷰와 함께하는 양식 스테이크',
                hours: '12:00 - 22:00',
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
                isPopular: true,
                cuisineType: '양식'
            },
            {
                name: '블루 라떼 카페',
                floor: '2F',
                locationCode: 'B-205',
                description: '직접 로스팅한 원두와 디저트',
                hours: '10:00 - 22:00',
                imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
                isPopular: false,
                cuisineType: '카페/디저트'
            }
        ]);

        console.log(`${restaurants.length} restaurants created.`);

        // 3. 메뉴 데이터 생성
        await Menu.create([
            {
                name: '마당 프리미엄 한상',
                description: '보리굴비와 12첩 반상',
                price: 25000,
                imageUrl: 'https://images.unsplash.com/photo-1553163147-622820be2931?auto=format&fit=crop&w=600&q=80',
                restaurantId: restaurants[0]._id,
                category: '메인',
                recommend: true
            },
            {
                name: '티본 스테이크',
                description: '최상급 한우 티본 스테이크',
                price: 48000,
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
                restaurantId: restaurants[1]._id,
                category: '메인',
                recommend: true
            },
            {
                name: '애플망고 빙수',
                description: '제주산 애플망고가 듬뿍',
                price: 18000,
                imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
                restaurantId: restaurants[2]._id,
                category: '디저트',
                recommend: true
            }
        ]);

        console.log('Menu data seeded.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
