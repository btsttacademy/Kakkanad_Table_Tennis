const express = require('express');
const router = express.Router();
const { 
  submitReview, 
  getTestimonials, 
  checkUserReview, 
  getReviewsStats
} = require('../services/reviewsService');

// Submit review
router.post('/submit', async (req, res) => {
  try {
    const result = await submitReview(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all testimonials - SINGLE API
router.get('/testimonials', async (req, res) => {
  try {
    const result = await getTestimonials();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get testimonials: ' + error.message
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
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews stats: ' + error.message
    });
  }
});

module.exports = router;