const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');
const User = require('./User');
// const Product = require('./Product'); // Removed as Product is now Mongo

const Slot = sequelize.define('Slot', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    slot_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('AVAILABLE', 'IN_CART', 'PAID', 'DELIVERING', 'COMPLETED'),
        defaultValue: 'AVAILABLE'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Can be null if using Product base_price
    },
    lock_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // explicitly defining foreign keys if needed, or allowing sequelize to handle via associations
    product_id: {
        type: DataTypes.STRING, // Storing MongoDB ObjectId as string
        allowNull: true
    },
    current_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    /* markerId: {
        type: DataTypes.STRING, 
        allowNull: true
    } */
}, {
    tableName: 'slots',
    timestamps: true
});

// Associations
Slot.belongsTo(User, { foreignKey: 'current_user_id' }); // Locks the slot

module.exports = Slot;
