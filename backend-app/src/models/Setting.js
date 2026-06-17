const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'settings',
    timestamps: true
});

module.exports = Setting;
