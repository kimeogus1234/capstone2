const Menu = require('../models/Menu');

exports.getMenus = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        const filter = restaurantId ? { restaurantId } : {};
        const menus = await Menu.find(filter).sort({ category: 1, createdAt: -1 });
        res.json(menus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createMenu = async (req, res) => {
    try {
        const menu = new Menu(req.body);
        await menu.save();
        res.status(201).json(menu);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateMenu = async (req, res) => {
    try {
        const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!menu) return res.status(404).json({ message: 'Menu not found' });
        res.json(menu);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMenu = async (req, res) => {
    try {
        const menu = await Menu.findByIdAndDelete(req.params.id);
        if (!menu) return res.status(404).json({ message: 'Menu not found' });
        res.json({ message: 'Menu deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
