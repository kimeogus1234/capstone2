const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { search, role } = req.query;

        const { Op } = require('sequelize');
        let where = {};

        // 검색어 필터 (아이디 또는 이름)
        if (search) {
            where[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } }
            ];
        }

        // 역할 필터
        if (role && role !== 'ALL') {
            where.role = role;
        }

        // 데이터와 전체 개수를 동시에 가져옴
        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: ['id', 'username', 'name', 'role', 'mileage', 'department', 'managed_categories', 'assignedStoreId', 'createdAt'],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const parsed = users.map(u => {
            const data = u.toJSON();
            try { 
                data.managed_categories = JSON.parse(u.managed_categories || '[]'); 
            } catch (e) { 
                data.managed_categories = []; 
            }
            return data;
        });

        res.json({
            users: parsed,
            totalCount: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, department, managed_categories, assignedStoreId } = req.body;

        const validRoles = ['CUSTOMER', 'DELIVERY', 'STAFF', 'ADMIN'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (role) user.role = role;
        if (department !== undefined) user.department = department;
        if (managed_categories) user.managed_categories = JSON.stringify(managed_categories);
        if (assignedStoreId !== undefined) user.assignedStoreId = assignedStoreId;
        await user.save();

        res.json({ message: 'User updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, password, role, department, managed_categories, assignedStoreId } = req.body;
        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(400).json({ message: 'Username already exists' });

        // 보안을 위해 비밀번호 해싱 처리
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ 
            username, 
            password: hashedPassword, 
            role: role || 'CUSTOMER', 
            department,
            managed_categories: JSON.stringify(managed_categories || []),
            assignedStoreId
        });
        res.status(201).json({ message: 'User created successfully', user: { id: user.id, username: user.username, role: user.role, department: user.department } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Protect last admin from deletion (optional but good practice)
        if (user.role === 'ADMIN') {
            const adminCount = await User.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) return res.status(400).json({ message: 'Cannot delete the only admin' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getUsers, updateUserRole, createUser, deleteUser };
