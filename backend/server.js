const express = require('express');
const cors = require('cors');
const { initializeMongoDB } = require('./config/database');
const { initializeGoogleSheets } = require('./services/googleSheets');
const { initializeSheets: initializeWebContentSheets } = require('./services/webContentService');
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

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        mongodb: 'connected',
        googleSheets: 'initialized'
      }
    };

    try {
      const { getCacheStatus } = require('./services/webContentService');
      const cacheStatus = getCacheStatus();
      healthStatus.services.webContent = {
        status: 'available',
        hasCache: cacheStatus.hasCache,
        cacheAge: cacheStatus.cacheAge
      };
    } catch (error) {
      healthStatus.services.webContent = {
        status: 'error',
        error: error.message
      };
    }

    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
async function startServer() {
  try {
    await initializeMongoDB();
    await initializeGoogleSheets();
    
    try {
      await initializeWebContentSheets();
    } catch (webContentError) {
      // Continue without web content sheets
    }
    
    try {
      await initializeReviewsSheets();
    } catch (reviewsError) {
      // Continue without reviews sheets
    }
    
    try {
      await initializeGallerySheets();
    } catch (galleryError) {
      // Continue without gallery sheets
    }
    
    try {
      await initializeAwardsSheets();
    } catch (awardsError) {
      // Continue without awards sheets
    }
    
    app.listen(port, () => {
      // Server started successfully
    });
    
  } catch (error) {
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  process.exit(0);
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

startServer();