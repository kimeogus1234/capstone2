const Slot = require('../models/Slot');
const Log = require('../models/Log');
const { sequelize } = require('../config/mysql');
const { Op } = require('sequelize');

const lockSlot = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const t = await sequelize.transaction();

    try {
        const slot = await Slot.findByPk(id, { transaction: t, lock: true });

        if (!slot) {
            await t.rollback();
            return res.status(404).json({ message: 'Slot not found' });
        }

        if (slot.status !== 'AVAILABLE') {
            // Check if expired
            if (slot.lock_expires_at && new Date() > slot.lock_expires_at) {
                // Determine it's expired, reset first
            } else {
                await t.rollback();
                return res.status(409).json({ message: 'Slot not available' });
            }
        }

        slot.status = 'IN_CART';
        slot.current_user_id = userId;
        slot.lock_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await slot.save({ transaction: t });
        await t.commit();

        // Log to Mongo
        await Log.create({
            action_type: 'SLOT_0CK',
            user_id: userId,
            metadata: { slot_id: id }
        });

        res.json(slot);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

const updatePrice = async (req, res) => {
    // Staff only
    try {
        const { id } = req.params;
        const { price } = req.body;
        await Slot.update({ price }, { where: { id } });
        res.json({ message: 'Price updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { lockSlot, updatePrice };
