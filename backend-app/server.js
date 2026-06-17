require('dotenv').config();
const dns = require('dns');

// MongoDB Atlas SRV lookup fails on some local/school networks
// Force Google DNS to resolve MongoDB servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const cors = require('cors');
const { sequelize, connectMySQL } = require('./src/config/mysql');
const { connectMongoDB } = require('./src/config/mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());

app.use(express.json());

// 🔹 허용 IP
// 🔹 허용 IP 리스트를 환경 변수에서 읽어옵니다. (없으면 로컬호스트 기본)
const allowedIPs = (process.env.ALLOWED_IPS || '127.0.0.1').split(',');

// 🔹 trust proxy false (rate-limit 안전)
app.set('trust proxy', false);

// 🔹 IP 접근 제한 미들웨어 (테스트 시 필요하면 앱 미들웨어로 등록하세요)

// 🔹 Rate Limiting (경고 없이 IPv4 안전)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
    // keyGenerator 생략 → 기본값 사용 (IPv6-safe)
});
app.use('/api', limiter);

// 🔹 Models
const Slot = require('./src/models/Slot');
const MapMarker = require('./src/models/MapMarker');
const Setting = require('./src/models/Setting');

// 🔹 Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/slots', require('./src/routes/slotRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/map', require('./src/routes/mapRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/stores', require('./src/routes/storeRoutes')); // 🏪 스토어 라우트 등록
app.use('/api/promotions', require('./src/routes/promotionRoutes')); // 🎁 프로모션 라우트 등록
app.use('/api/coupons', require('./src/routes/couponRoutes')); // 🎫 [NEW] 쿠폰 라우트 등록
console.log("🚀 [SERVER] Loading Dining Routes...");
app.use('/api/dining', require('./src/routes/diningRoutes'));

// 🔹 Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/downloads', express.static(path.join(__dirname, 'public', 'downloads')));

// 🔹 Web Fallback for NFC
app.get('/nfc/product/:id', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Smart Store Product</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                <h1>Product ID: ${req.params.id}</h1>
                <p>Opening app...</p>
                <script>
                    window.location.href = 'smartstore://nfc/product/${req.params.id}';
                    setTimeout(() => {
                        document.body.innerHTML += '<p>App not found. <a href="#">Download here</a></p>';
                    }, 2000);
                </script>
            </body>
        </html>
    `);
});

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

// 🔹 React Frontend (MadangMW) Static Hosting & SPA Fallback
const frontendDistPath = path.join(__dirname, '../MadangMW/dist');
app.use(express.static(frontendDistPath));

// API나 기존 정적 경로에 걸리지 않은 모든 요청은 React SPA(index.html)로 몰아주기 (SPA Fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
        if (err) {
            // index.html 파일이 존재하지 않는 경우 (예: 빌드가 되지 않은 경우) 예외 처리
            res.status(404).send('Frontend build (index.html) not found. Please run "npm run build" in MadangMW directory.');
        }
    });
});

// 🔹 서버 시작
const startServer = async () => {
    try {
        await connectMongoDB();
        await connectMySQL();
        require('./src/models/User'); // 👤 1. 유저 셜계도 먼저 읽기 (kakaoId 반영용)
        await sequelize.sync({ alter: true }); // 🛠️ 2. 설계도대로 DB 고치기 (강제!)
        console.log('Databases connected.');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`📡Backend Server running on port ${PORT} (Listening on all interfaces)`);
        });
    } catch (error) {
        console.error('❌ CRITICAL ERROR: Failed to start server!');
        console.error('Error details:', error);
        process.exit(1);
    }
};

startServer();
