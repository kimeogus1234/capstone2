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
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('CUSTOMER', 'DELIVERY', 'STAFF', 'ADMIN'),
        defaultValue: 'CUSTOMER'
    },
    mileage: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    managed_categories: {
        type: DataTypes.TEXT, // For categories
        allowNull: true,
        defaultValue: '[]'
    },
    assignedStoreId: {
        type: DataTypes.STRING, // For Starfield store linkage
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { fields: ['name'] },
        { fields: ['role'] }
    ]
});

module.exports = User;
