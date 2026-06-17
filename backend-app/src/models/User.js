const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'users_username_unique'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    birthYear: { // 🎂 주류 구매 등 연령 확인용
        type: DataTypes.STRING,
        allowNull: true
    },
    profileImage: { // 🖼️ 프로필 사진 URL
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true // Kakao users don't have local password
    },
    kakaoId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'users_kakaoId_unique'
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'users_googleId_unique'
    },
    naverId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'users_naverId_unique'
    },

    role: {
        type: DataTypes.ENUM('CUSTOMER', 'DELIVERY', 'STAFF', 'ADMIN'),
        defaultValue: 'CUSTOMER'
    },
    mileage: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    phone: { // 📞 유저 연락처 추가
        type: DataTypes.STRING,
        allowNull: true
    },
    addresses: { // 🏠 배송지 목록 (JSON 형태)
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    wishlist: { // 찜한 상품 ID 목록
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;
