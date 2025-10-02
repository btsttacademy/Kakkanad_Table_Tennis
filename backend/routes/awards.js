const express = require('express');
const router = express.Router();
const { 
  getAwardsData,
  testAwardsConnection 
} = require('../services/awardsService');

// Get awards data - MAIN ENDPOINT
router.get('/', async (req, res) => {
  try {
    console.log('📨 Received request for awards data');
    const result = await getAwardsData();
    
    if (result.success) {
      console.log(`✅ Sending ${result.totalAwards} awards to client`);
    } else {
      console.log('❌ Failed to get awards data:', result.message);
    }
    
    res.json(result);
  } catch (error) {
    console.error('💥 Error in awards route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      data: [],
      totalAwards: 0
    });
  }
});

// Test awards connection
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing awards connection...');
    const result = await testAwardsConnection();
    res.json(result);
  } catch (error) {
    console.error('💥 Error testing awards connection:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed: ' + error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Awards API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;