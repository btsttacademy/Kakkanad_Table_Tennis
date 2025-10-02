const express = require('express');
const router = express.Router();
const { 
  submitReview, 
  getTestimonials, 
  checkUserReview, 
  getReviewsStats, 
  testReviewsConnection,
  manualSync,
  forceRefresh
} = require('../services/reviewsService');

// Submit review
router.post('/submit', async (req, res) => {
  try {
    const result = await submitReview(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const result = await getTestimonials();
    res.json(result);
  } catch (error) {
    console.error('Error getting testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get testimonials: ' + error.message
    });
  }
});

// Force refresh testimonials (triggers sync and returns fresh data)
router.get('/testimonials/refresh', async (req, res) => {
  try {
    const result = await forceRefresh();
    res.json(result);
  } catch (error) {
    console.error('Error refreshing testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh testimonials: ' + error.message
    });
  }
});

// Check if user has reviewed
router.get('/check', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    const result = await checkUserReview(email);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error checking user review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check review: ' + error.message
    });
  }
});

// Get reviews statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await getReviewsStats();
    res.json(result);
  } catch (error) {
    console.error('Error getting reviews stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews stats: ' + error.message
    });
  }
});

// Manual sync trigger
router.post('/sync', async (req, res) => {
  try {
    await manualSync();
    res.json({
      success: true,
      message: 'Manual sync completed successfully'
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed: ' + error.message
    });
  }
});

// Test reviews connection
router.get('/test', async (req, res) => {
  try {
    const result = await testReviewsConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing reviews connection:', error);
    res.status(500).json({
      success: false,
      message: 'Reviews test failed: ' + error.message
    });
  }
});



module.exports = router;