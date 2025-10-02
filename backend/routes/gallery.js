const express = require('express');
const router = express.Router();
const { 
  getGalleryData,
  testGalleryConnection 
} = require('../services/galleryService');

// Get gallery data - ONLY ENDPOINT NEEDED
router.get('/', async (req, res) => {
  try {
    const result = await getGalleryData();
    res.json(result);
  } catch (error) {
    console.error('Error getting gallery data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery data: ' + error.message
    });
  }
});

// Test gallery connection (optional)
router.get('/test', async (req, res) => {
  try {
    const result = await testGalleryConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing gallery connection:', error);
    res.status(500).json({
      success: false,
      message: 'Gallery test failed: ' + error.message
    });
  }
});

module.exports = router;