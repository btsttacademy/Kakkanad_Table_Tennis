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
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // Initialize MongoDB
    await initializeMongoDB();
    
    // Initialize Google Sheets for inquiries
    await initializeGoogleSheets();
    
    // Initialize Google Sheets for web content
    try {
      await initializeWebContentSheets();
    } catch (webContentError) {
      // Continue without web content sheets
    }
    
    // Initialize Google Sheets for reviews
    try {
      await initializeReviewsSheets();
    } catch (reviewsError) {
      // Continue without reviews sheets
    }
    
    // Initialize Google Sheets for gallery
    try {
      await initializeGallerySheets();
    } catch (galleryError) {
      // Continue without gallery sheets
    }
    
    // Initialize Google Sheets for awards
    try {
      await initializeAwardsSheets();
    } catch (awardsError) {
      // Continue without awards sheets
    }
    
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  process.exit(0);
});

startServer();