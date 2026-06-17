const express = require('express');
const router = express.Router();
const { register, login, kakaoLogin, googleLogin, naverLogin, chargeMileage, updateProfile, checkUsername, sendCode, verifyCode, findId, resetPassword, deleteAccount } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/kakao-login', kakaoLogin);
router.post('/google-login', googleLogin); // 🔵 구글 로그인 라우트
router.post('/naver-login', naverLogin);   // 🟢 네이버 로그인 라우트
router.post('/check-username', checkUsername); // 🆔 아이디 중복 확인 추가
router.post('/send-code', sendCode);           // 📧 이메일 인증코드 발송 추가
router.post('/verify-code', verifyCode);       // ✅ 인증코드 검증 추가
router.post('/find-id', findId);               // 🔍 아이디 찾기 추가
router.post('/reset-password', resetPassword); // 🔄 비밀번호 재설정 추가
router.post('/delete-account', deleteAccount); // 🗑️ 회원 탈퇴 추가

router.put('/profile/:id', require('../middleware/auth').verifyToken, updateProfile);
router.post('/charge', require('../middleware/auth').verifyToken, chargeMileage);

module.exports = router;
