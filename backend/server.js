require('dotenv').config();
const dns = require('dns');

// DNS 에러 방지 (MongoDB 연결용)
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const { sequelize, connectMySQL } = require('./src/config/mysql');
const { connectMongoDB } = require('./src/config/mongo');
const helmet = require('helmet');
const path = require('path');
const orderController = require('./src/controllers/orderController');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 기본 보안 및 CORS 설정
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

// 🔹 Routes 설정
const { verifyToken } = require('./src/middleware/auth');

app.use('/api/auth', require('./src/routes/authRoutes'));

// 🔐 개별 라우트 파일에서 필요한 경우에만 verifyToken을 사용하도록 구성되어 있습니다.
// 전역에서 강제하면 비로그인 접근 기능(지도 등)이 차단되므로 제거합니다.

app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/slots', require('./src/routes/slotRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/promotions', require('./src/routes/promotionRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/map', require('./src/routes/mapRoutes'));
app.use('/api/stores', require('./src/routes/storeRoutes'));
app.use('/api/events', require('./src/routes/eventRoutes'));
app.use('/api/parking', require('./src/routes/parkingRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/menus', require('./src/routes/menuRoutes'));
app.use('/api/restaurants', require('./src/routes/restaurantRoutes'));
app.use('/api/stats', require('./src/routes/statsRoutes'));

// 🔹 정적 파일 서비스 (도커 컨테이너 내부 절대 경로 및 로컬 상대 경로 모두 대응)
const fs = require('fs');
const uploadsPath = fs.existsSync('/usr/src/app/uploads')
    ? '/usr/src/app/uploads'
    : path.join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
        // .jfif 확장자는 브라우저 및 앱에서 바이너리로 다운로드되거나 깨지지 않고 정상 이미지(image/jpeg)로 디코딩되도록 헤더를 강제 설정합니다.
        if (filePath.endsWith('.jfif')) {
            res.setHeader('Content-Type', 'image/jpeg');
        }
    }
}));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));

// 🔹 Toss Payments Webview Redirect Fallback
app.get('/success', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Payment Success</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9f9f9; }
                    .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center; }
                    h1 { color: #2ecc71; margin-bottom: 10px; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>결제 성공 🎉</h1>
                    <p>결제가 완료되었습니다. 앱으로 돌아갑니다...</p>
                </div>
            </body>
        </html>
    `);
});

app.get('/fail', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Payment Fail</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9f9f9; }
                    .card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); text-align: center; }
                    h1 { color: #e74c3c; margin-bottom: 10px; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>결제 실패 ❌</h1>
                    <p>결제 진행 중 실패가 발생했습니다. 앱으로 돌아갑니다...</p>
                </div>
            </body>
        </html>
    `);
});

// 🔹 서버 시작 로직
const startServer = async () => {
    try {
        await connectMongoDB();
        await connectMySQL();
        await sequelize.sync();
        console.log('✅ Databases connected (Synced).');

        // 테스트 주문 데이터 생성
        await orderController.seedOrders();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
    }
};

startServer();
