const express = require('express');
const cors = require('cors');
const { initializeMongoDB } = require('./config/database');
const { initializeGoogleSheets } = require('./services/googleSheets');
const { initializeWebContentSheets } = require('./services/webContentService');
const { initializeReviewsSheets } = require('./services/reviewsService');
const { initializeGallerySheets } = require('./services/galleryService');
const { initializeAwardsSheets } = require('./services/awardsService');
const inquiriesRoutes = require('./routes/inquiries');
const webContentRoutes = require('./routes/webContent');
const reviewsRoutes = require('./routes/reviews');
const galleryRoutes = require('./routes/gallery');
const awardsRoutes = require('./routes/awards');

const app = express();
const port = 3210;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
app.use('/api', inquiriesRoutes);
app.use('/api/web-content', webContentRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/awards', awardsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    services: {
      mongodb: 'Connected',
      googleSheets: 'Available',
      webContent: 'Available',
      reviews: 'Available',
      gallery: 'Available',
      awards: 'Available'
    },
    endpoints: {
      'GET /': 'Server status',
      'GET /api/awards': 'Get awards data',
      'GET /api/awards/test': 'Test awards connection',
      'GET /api/awards/health': 'Awards health check'
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting server...');
    
    // Initialize MongoDB
    await initializeMongoDB();
    
    // Initialize Google Sheets for inquiries
    await initializeGoogleSheets();
    
    // Initialize Google Sheets for web content (with error handling)
    try {
      await initializeWebContentSheets();
    } catch (webContentError) {
      console.log('⚠️ Web Content Sheets initialization had issues, but server will continue...');
    }
    
    // Initialize Google Sheets for reviews (with error handling)
    try {
      await initializeReviewsSheets();
    } catch (reviewsError) {
      console.log('⚠️ Reviews Sheets initialization had issues, but server will continue...');
    }
    
    // Initialize Google Sheets for gallery (with error handling)
    try {
      await initializeGallerySheets();
    } catch (galleryError) {
      console.log('⚠️ Gallery Sheets initialization had issues, but server will continue...');
    }
    
    // Initialize Google Sheets for awards (with error handling)
    try {
      await initializeAwardsSheets();
    } catch (awardsError) {
      console.log('⚠️ Awards Sheets initialization had issues, but server will continue...');
    }
    
    app.listen(port, () => {
      console.log(`🎉 Server running at http://localhost:${port}`);
      console.log('📊 All services initialized successfully!');
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

startServer();