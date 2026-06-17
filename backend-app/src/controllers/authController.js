const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const User = require('../models/User');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

// 📧 인증번호 저장을 위한 인메모리 저장소 (메모리 부족 시 Redis 권장)
const verificationCodes = new Map();

// ✉️ 메일 전송 객체 생성 함수 (도메인 자동 감지)
const createTransporter = () => {
    const user = process.env.EMAIL_USER || '';
    let service = 'naver'; 

    if (user.includes('@gmail.com')) service = 'gmail';
    else if (user.includes('@naver.com')) service = 'naver';
    
    console.log(`📡 [DEBUG] Email User: ${user}, Selected Service: ${service}`);

    return nodemailer.createTransport({
        service: service,
        auth: {
            user: user,
            pass: process.env.EMAIL_PASS
        }
    });
};

/** 🔐 [Premium] Ultimate Authentication & Profile Controller (Fixed) */
const authController = {
    // 👤 1. Registration
    register: async (req, res) => {
        try {
            const { username, password, name, role, email } = req.body;
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                username,
                name: name || username,
                email: email, // 📧 이메일 드디어 저장!
                password: hashedPassword,
                role: role || 'CUSTOMER'
            });

            res.status(201).json({ message: '회원가입이 완료되었습니다.', userId: user.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🔑 2. Login
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log(`🔑 [LOGIN TRY] Username: ${username}`);

            const user = await User.findOne({ where: { username } });

            if (!user) {
                console.warn(`❌ [LOGIN FAIL] User not found: ${username}`);
                return res.status(401).json({ message: '등록되지 않은 아이디입니다.' });
            }

            if (user.password) {
                const isMatch = await bcrypt.compare(password, user.password);
                console.log(`🔐 [AUTH] Password Match: ${isMatch}`);
                
                if (!isMatch) {
                    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
                }
            } else {
                console.warn(`⚠️ [LOGIN] This user has no password (maybe Kakao user?): ${username}`);
                return res.status(401).json({ message: '카카오로 가입된 계정입니다. 간편 로그인을 이용해주세요.' });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, username: user.username },
                process.env.JWT_SECRET || 'supersecret',
                { expiresIn: '90d' }
            );

            res.json({
                token,
                user: { 
                    id: user.id, 
                    role: user.role, 
                    mileage: user.mileage, 
                    username: user.username, 
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    profileImage: user.profileImage
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🟡 3. Kakao Login
    kakaoLogin: async (req, res) => {
        try {
            const { accessToken } = req.body;
            if (!accessToken) return res.status(400).json({ message: '카카오 인증 토큰이 없습니다.' });

            const kakaoRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const { id, properties, kakao_account } = kakaoRes.data;
            const kakaoIdStr = id.toString();
            const realNickname = properties?.nickname || `kakao_${kakaoIdStr}`;
            const profileImage = properties?.profile_image || null;
            const email = kakao_account?.email || null;
            const birthYear = kakao_account?.birthyear || null;
            const phone = kakao_account?.phone_number || null;

            let user = await User.findOne({ where: { kakaoId: kakaoIdStr } });

            if (!user) {
                user = await User.create({
                    username: `kakao_${kakaoIdStr}`,
                    name: realNickname,
                    email: email,
                    birthYear: birthYear,
                    phone: phone,
                    profileImage: profileImage,
                    kakaoId: kakaoIdStr,
                    role: 'CUSTOMER',
                    mileage: 1000
                });
            } else if (profileImage && !user.profileImage) {
                user.profileImage = profileImage;
                await user.save();
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, username: user.username },
                process.env.JWT_SECRET || 'supersecret',
                { expiresIn: '90d' }
            );

            res.json({
                token,
                user: { 
                    id: user.id, 
                    role: user.role, 
                    mileage: user.mileage, 
                    username: user.username, 
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    profileImage: user.profileImage
                }
            });
        } catch (error) {
            console.error('Kakao Login Error:', error.message);
            console.error('Kakao Error Status:', error.response?.status);
            console.error('Kakao Error Data:', JSON.stringify(error.response?.data));
            res.status(401).json({ message: '카카오 로그인에 실패했습니다.', detail: error.response?.data || error.message });
        }
    },

    // 🔵 3-1. Google Login (Structure)
    googleLogin: async (req, res) => {
        try {
            const { idToken, userInfo } = req.body;
            if (!idToken) return res.status(400).json({ message: '구글 인증 토큰이 없습니다.' });

            const googleIdStr = userInfo?.id || `google_temp_${Date.now()}`;
            const realNickname = userInfo?.name || `google_${googleIdStr.substring(0,6)}`;
            const profileImage = userInfo?.photo || userInfo?.picture || null;
            const email = userInfo?.email || '';
            const phone = userInfo?.phone || null;
            const birthYear = userInfo?.birthYear || null;

            let user = await User.findOne({ where: { googleId: googleIdStr } });

            if (!user) {
                user = await User.create({
                    username: `google_${googleIdStr}`,
                    name: realNickname,
                    email: email,
                    phone: phone,
                    birthYear: birthYear,
                    profileImage: profileImage,
                    googleId: googleIdStr,
                    role: 'CUSTOMER',
                    mileage: 1000
                });
            } else if (profileImage && !user.profileImage) {
                user.profileImage = profileImage;
                await user.save();
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, username: user.username },
                process.env.JWT_SECRET || 'supersecret',
                { expiresIn: '90d' }
            );

            res.json({
                token,
                user: { id: user.id, role: user.role, mileage: user.mileage, username: user.username, email: user.email, name: user.name, phone: user.phone, profileImage: user.profileImage }
            });
        } catch (error) {
            console.error('Google Login Error:', error.message);
            res.status(401).json({ message: '구글 로그인에 실패했습니다.', detail: error.message });
        }
    },

    // 🟢 3-2. Naver Login (Structure)
    naverLogin: async (req, res) => {
        try {
            const { accessToken } = req.body;
            if (!accessToken) return res.status(400).json({ message: '네이버 인증 토큰이 없습니다.' });

            const naverRes = await axios.get('https://openapi.naver.com/v1/nid/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (naverRes.data.resultcode !== '00') {
                return res.status(401).json({ message: '네이버 인증에 실패했습니다.' });
            }

            const { id, nickname, email, mobile, birthyear, profile_image } = naverRes.data.response;
            const naverIdStr = id.toString();
            const realNickname = nickname || `naver_${naverIdStr.substring(0,6)}`;

            let user = await User.findOne({ where: { naverId: naverIdStr } });

            if (!user) {
                user = await User.create({
                    username: `naver_${naverIdStr}`,
                    name: realNickname,
                    email: email || '',
                    phone: mobile || null,
                    birthYear: birthyear || null,
                    profileImage: profile_image || null,
                    naverId: naverIdStr,
                    role: 'CUSTOMER',
                    mileage: 1000
                });
            } else if (profile_image && !user.profileImage) {
                user.profileImage = profile_image;
                await user.save();
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, username: user.username },
                process.env.JWT_SECRET || 'supersecret',
                { expiresIn: '90d' }
            );

            res.json({
                token,
                user: { id: user.id, role: user.role, mileage: user.mileage, username: user.username, email: user.email, name: user.name, phone: user.phone, profileImage: user.profileImage }
            });
        } catch (error) {
            console.error('Naver Login Error:', error.message);
            res.status(401).json({ message: '네이버 로그인에 실패했습니다.', detail: error.message });
        }
    },

    // ✏️ 4. Profile Update
    updateProfile: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            console.log(`✏️ [EDIT] Request - UserID: ${id}, Name: ${name}`);

            const user = await User.findByPk(id);
            if (!user) {
                console.warn(`❌ [EDIT] User NOT FOUND (ID: ${id})`);
                return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
            }

            if (name) user.name = name;
            if (req.body.phone !== undefined) user.phone = req.body.phone; // 📞 연락처 업데이트 추가
            if (req.body.email !== undefined) user.email = req.body.email; // 📧 이메일 업데이트 추가

            // 🆔 아이디(username) 변경
            if (req.body.username) {
                const existing = await User.findOne({ where: { username: req.body.username } });
                if (existing && existing.id !== user.id) {
                    return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
                }
                user.username = req.body.username;
            }

            // 🔐 비밀번호 변경 (암호화)
            if (req.body.password) {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                user.password = hashedPassword;
            }

            await user.save();

            console.log(`✅ [EDIT] SUCCESS! ${user.username} is now: ${user.name}, Phone: ${user.phone}, Email: ${user.email}`);
            res.json({ message: '개인정보가 수정되었습니다.', user: { id: user.id, username: user.username, name: user.name, phone: user.phone, email: user.email } });
        } catch (error) {
            console.error('❌ [EDIT] FATAL ERROR:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    // 💰 5. Charge Mileage
    chargeMileage: async (req, res) => {
        try {
            const { amount } = req.body;
            const user = await User.findByPk(req.user.id);
            user.mileage += parseInt(amount);
            await user.save();
            res.json({ message: '마일리지가 충전되었습니다.', mileage: user.mileage });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🔍 6. Check Username Availability
    checkUsername: async (req, res) => {
        try {
            const { username } = req.body;
            const user = await User.findOne({ where: { username } });
            res.json({ available: !user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 📧 7. Send Verification Code (Real)
    sendCode: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: '이메일 주소를 입력해주세요.' });

            // 6자리 난수 생성
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // 유효시간 5분 설정
            const expires = Date.now() + 5 * 60 * 1000;
            verificationCodes.set(email, { code, expires });

            console.log(`📧 Sending code ${code} to: ${email}`);

            // 실제 메일 발송 로직 (설정이 되어 있을 때만)
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = createTransporter(); // 실시간 생성
                await transporter.sendMail({
                    from: `"MadangM Manager" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: '[MadangM] 회원가입 인증번호입니다.',
                    text: `인증번호: ${code}`,
                    html: `<h3>[MadangM] 회원가입 인증번호</h3><p>인증번호 <b>${code}</b>를 입력하여 가입을 완료해주세요.</p><p>유효시간은 5분입니다.</p>`
                });
            } else {
                console.warn('⚠️ EMAIL_USER/PASS not set. Only console logging the code.');
            }

            res.json({ message: '이메일로 인증번호가 전송되었습니다.' });
        } catch (error) {
            console.error('Mail Send Error:', error);
            res.status(500).json({ error: 'Failed to send email.' });
        }
    },

    // ✅ 8. Verify Code (Real)
    verifyCode: async (req, res) => {
        try {
            const { email, code } = req.body;
            const record = verificationCodes.get(email);

            if (!record) {
                return res.status(400).json({ message: '인증 요청 기록이 없습니다.' });
            }

            if (Date.now() > record.expires) {
                verificationCodes.delete(email);
                return res.status(400).json({ message: '인증 코드가 만료되었습니다. 다시 요청해주세요.' });
            }

            if (record.code !== code) {
                return res.status(400).json({ message: '인증 코드가 일치하지 않습니다.' });
            }

            // 인증 성공 시 기록 삭제 (재사용 방지)
            verificationCodes.delete(email);
            res.json({ success: true, message: '이메일 인증이 완료되었습니다.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🆔 9. Find ID
    findId: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email: email } });
            if (!user) return res.status(404).json({ message: '해당 이메일로 가입된 아이디가 없습니다.' });
            res.json({ username: user.username });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🔄 10. Reset Password
    resetPassword: async (req, res) => {
        try {
            const { username, email, newPassword } = req.body;
            const user = await User.findOne({ where: { username, email } });
            if (!user) return res.status(404).json({ message: '아이디와 이메일 정보가 일치하지 않습니다.' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
            res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🗑️ 11. Delete Account
    deleteAccount: async (req, res) => {
        try {
            const { userId, password } = req.body;
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

            await user.destroy();
            res.json({ message: '회원 탈퇴가 완료되었습니다.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = authController;
