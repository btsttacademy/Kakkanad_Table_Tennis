const express = require('express');
const router = express.Router();
const { 
  getWebContent,
  refreshWebContent,
  initializeSheets,
  testConnection
} = require('../services/webContentService');

// Initialize sheets on startup
initializeSheets().catch(console.error);

// Single API endpoint to get all web content
router.get('/', async (req, res) => {
  try {
    const { refresh } = req.query;
    
    let result;
    if (refresh === 'true') {
      console.log('🔄 Manual refresh requested');
      result = await refreshWebContent();
    } else {
      result = await getWebContent();
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get web content: ' + error.message
    });
  }
});

// Force refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const result = await refreshWebContent();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to refresh content: ' + error.message
    });
  }
});

// Test connection endpoint
router.get('/test', async (req, res) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connection test failed: ' + error.message
    });
  }
});

module.exports = router;