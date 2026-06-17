const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    action_type: { type: String, required: true },
    user_id: { type: Number }, // Reference to MySQL User ID
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('Log', LogSchema);
