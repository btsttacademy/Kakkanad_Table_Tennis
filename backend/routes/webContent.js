const express = require('express');
const router = express.Router();
const { 
  getWebContent, 
  refreshWebContent, 
  updateWebContent, 
  testWebContentConnection, 
  getAvailableFields,
  debugSheetData  // Add this
} = require('../services/webContentService');

// Get web content
router.get('/', async (req, res) => {
  try {
    const content = await getWebContent();
    res.json(content);
  } catch (error) {
    console.error('Error fetching web content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web content: ' + error.message,
      error: error.message // Include actual error for debugging
    });
  }
});

// Refresh web content (force update)
router.get('/refresh', async (req, res) => {
  try {
    const content = await refreshWebContent();
    res.json(content);
  } catch (error) {
    console.error('Error refreshing web content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh web content: ' + error.message,
      error: error.message // Include actual error for debugging
    });
  }
});

// Update web content (admin endpoint)
router.put('/update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }
    
    const result = await updateWebContent(updates);
    res.json(result);
  } catch (error) {
    console.error('Error updating web content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update web content: ' + error.message
    });
  }
});

// Test web content connection
router.get('/test', async (req, res) => {
  try {
    const result = await testWebContentConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing web content:', error);
    res.status(500).json({
      success: false,
      message: 'Web content test failed: ' + error.message
    });
  }
});

// Get available fields
router.get('/fields', (req, res) => {
  try {
    const result = getAvailableFields();
    res.json(result);
  } catch (error) {
    console.error('Error getting available fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available fields: ' + error.message
    });
  }
});

// Debug endpoint to check sheet data
router.get('/debug', async (req, res) => {
  try {
    const result = await debugSheetData();
    res.json(result);
  } catch (error) {
    console.error('Error debugging sheet data:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed: ' + error.message
    });
  }
});

module.exports = router;