const express = require('express');
const router = express.Router();
const { addToGoogleSheets } = require('../services/googleSheets');
const { getDatabase } = require('../config/database');

// Submit inquiry
router.post('/inquiries', async (req, res) => {
  try {
    const { name, phoneNumber, question } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    const inquiryData = {
      name: name.toString().trim(),
      phoneNumber: phoneNumber.toString().trim(),
      question: question ? question.toString().trim() : '',
      timestamp: new Date(),
      status: 'New'
    };

    let mongoResult = null;
    let sheetsResult = null;

    // Store in MongoDB
    const db = getDatabase();
    const collection = db.collection('inquiries');
    mongoResult = await collection.insertOne(inquiryData);
    console.log('✅ Data stored in MongoDB');

    // Store in Google Sheets
    sheetsResult = await addToGoogleSheets(inquiryData, mongoResult.insertedId);
    console.log('✅ Data stored in Google Sheets');

    res.json({
      success: true,
      message: 'Inquiry submitted successfully!',
      storedIn: {
        mongodb: {
          id: mongoResult.insertedId,
          database: 'testdb'
        },
        googleSheets: {
          sheet: 'Inquiries',
          status: 'Stored ✅'
        }
      },
      timestamp: new Date().toString()
    });

  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry: ' + error.message
    });
  }
});

// Get all inquiries
router.get('/inquiries', async (req, res) => {
  try {
    const db = getDatabase();
    const collection = db.collection('inquiries');
    const inquiries = await collection.find({}).sort({ timestamp: -1 }).toArray();
    
    res.json({
      success: true,
      inquiries: inquiries,
      count: inquiries.length
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({
      success: false,
      message: error.toString()
    });
  }
});

// Test MongoDB connection
router.get('/test-mongodb', async (req, res) => {
  try {
    const db = getDatabase();
    const collection = db.collection('connection_test');
    const testDoc = {
      message: 'MongoDB connection test',
      timestamp: new Date(),
      status: 'success'
    };
    
    const result = await collection.insertOne(testDoc);
    const foundDoc = await collection.findOne({ _id: result.insertedId });
    
    // Clean up
    await collection.deleteOne({ _id: result.insertedId });
    
    res.json({
      success: true,
      message: 'MongoDB connection test successful',
      insertedId: result.insertedId
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'MongoDB test failed: ' + error.message
    });
  }
});

module.exports = router;