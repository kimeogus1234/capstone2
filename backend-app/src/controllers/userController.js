const User = require('../models/User');
const Product = require('../models/Product');
const { resolveAuthUserId } = require('../utils/authUser');
const { normalizeAddresses } = require('../utils/addresses');

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'role', 'mileage', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['CUSTOMER', 'DELIVERY', 'STAFF', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = role;
        await user.save();

        res.json({ message: 'Role updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAddresses = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, addresses: normalizeAddresses(user.addresses) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateAddresses = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        const { addresses } = req.body;

        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.addresses = normalizeAddresses(addresses);
        await user.save();

        res.json({ success: true, message: 'Addresses updated', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const wishlistIds = user.wishlist || [];
        // Fetch product details from MongoDB
        const products = await Product.find({ _id: { $in: wishlistIds } });
        res.json({ success: true, wishlist: products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        const { productId } = req.body;
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
        if (!productId) return res.status(400).json({ message: 'Product ID is required' });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let wishlist = user.wishlist || [];
        if (!wishlist.includes(productId)) {
            wishlist = [...wishlist, productId];
            user.wishlist = wishlist;
            await user.save();
        }

        res.json({ success: true, message: 'Added to wishlist', wishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = resolveAuthUserId(req);
        const { productId } = req.params;
        if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
        if (!productId) return res.status(400).json({ message: 'Product ID is required' });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let wishlist = user.wishlist || [];
        if (wishlist.includes(productId)) {
            wishlist = wishlist.filter(id => id !== productId);
            user.wishlist = wishlist;
            await user.save();
        }

        res.json({ success: true, message: 'Removed from wishlist', wishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getUsers, updateUserRole, getAddresses, updateAddresses, getWishlist, addToWishlist, removeFromWishlist };
