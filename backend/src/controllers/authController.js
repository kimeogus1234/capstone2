const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const register = async (req, res) => {
    try {
        const { username, password, role, department, managed_categories, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ 
            username, 
            name: name || '',
            password: hashedPassword, 
            role: role || 'CUSTOMER',
            department: department || null,
            managed_categories: managed_categories ? JSON.stringify(managed_categories) : '[]',
            assignedStoreId: req.body.assignedStoreId || null
        });
        res.status(201).json({ message: 'User created', userId: user.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (role && user.role !== role) {
            return res.status(403).json({ message: `Role Mismatch` });
        }

        let categories = [];
        try { categories = JSON.parse(user.managed_categories || '[]'); } catch(e) {}

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, name: user.name, managed_categories: categories, assignedStoreId: user.assignedStoreId },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role, mileage: user.mileage, managed_categories: categories, assignedStoreId: user.assignedStoreId } });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: error.message
        });
    }
};

const chargeMileage = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findByPk(req.user.id);
        user.mileage += parseInt(amount);
        await user.save();
        res.json({ message: 'Mileage charged', mileage: user.mileage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, chargeMileage };
