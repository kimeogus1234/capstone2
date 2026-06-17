const Slot = require('../models/Slot');
const Log = require('../models/Log');

const lockSlot = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const slot = await Slot.findById(id);

        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        if (slot.status !== 'AVAILABLE') {
            if (slot.lock_expires_at && new Date() > slot.lock_expires_at) {
                // Reset expired lock
            } else {
                return res.status(409).json({ message: 'Slot not available' });
            }
        }

        slot.status = 'IN_CART';
        slot.current_user_id = userId;
        slot.lock_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await slot.save();

        // Log to Mongo
        await Log.create({
            action_type: 'SLOT_LOCK',
            user_id: userId,
            metadata: { slot_id: id }
        });

        res.json(slot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        await Slot.findByIdAndUpdate(id, { price });
        res.json({ message: 'Price updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { lockSlot, updatePrice };
