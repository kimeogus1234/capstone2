const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        // Return the accessible URL for the uploaded file
        // Assumes static serving is set up for '/uploads'
        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            message: 'Image uploaded successfully',
            url: imageUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
