const Event = require('../models/Event');

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ isActive: true }).sort({ order: 1, startDate: -1 }).populate('storeId', 'name floor');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const event = new Event(req.body);
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.reorderEvents = async (req, res) => {
    try {
        const { eventIds } = req.body;
        if (!Array.isArray(eventIds)) {
            return res.status(400).json({ message: 'eventIds must be an array' });
        }
        const promises = eventIds.map((id, index) => 
            Event.findByIdAndUpdate(id, { order: index })
        );
        await Promise.all(promises);
        res.json({ message: 'Events reordered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
