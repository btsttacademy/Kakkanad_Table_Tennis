const { google } = require('googleapis');
const { getDatabase } = require('../config/database');

// Google Sheets configuration for reviews
const REVIEWS_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const REVIEWS_SHEET_NAME = 'Reviews';

let sheets;
let syncInterval;

// Reviews fields definition
const REVIEWS_FIELDS = [
  'Timestamp', 'Name', 'Email', 'Rating', 'Comment', 
  'Photo URL', 'Additional Photos Count', 'Status'
];

// Initialize Google Sheets for reviews
async function initializeReviewsSheets() {
  try {
    let auth;
    
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_PRIVATE_KEY) {
      const credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID || 'bts-tt-academy',
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '853877d3b7f471ff28ceafdcd5a39de945021579',
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL || 'bts-sheets-and-drive@bts-tt-academy.iam.gserviceaccount.com',
        client_id: process.env.GOOGLE_CLIENT_ID || '102050055441208325157',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/bts-sheets-and-drive%40bts-tt-academy.iam.gserviceaccount.com',
        universe_domain: 'googleapis.com'
      };

      auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    // Setup the reviews sheet and sync immediately
    await setupReviewsSheet();
    await syncSheetsToMongoDB();
    
    // Start auto-sync
    startAutoSync();
    
    return sheets;
  } catch (error) {
    // If Google Sheets fails, we'll work with existing MongoDB data
    return null;
  }
}

// Setup reviews sheet
async function setupReviewsSheet() {
  try {
    const lastColumn = String.fromCharCode(64 + REVIEWS_FIELDS.length);
    const range = `'${REVIEWS_SHEET_NAME}'!A1:${lastColumn}1`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: REVIEWS_SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: [REVIEWS_FIELDS]
      }
    });

  } catch (error) {
    // Headers may already exist, continue
    return;
  }
}

// Start automatic synchronization
function startAutoSync() {
  // Sync every 30 seconds
  syncInterval = setInterval(syncSheetsToMongoDB, 30000);
}

// Stop automatic synchronization
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
}

// Synchronize Google Sheets data to MongoDB - PRESERVE ADDITIONAL PHOTOS
async function syncSheetsToMongoDB() {
  try {
    const sheetData = await getReviewsFromSheets();
    
    if (!sheetData.success || !sheetData.reviews) {
      return;
    }

    const db = getDatabase();
    const collection = db.collection('reviews');

    // Get existing reviews from MongoDB to preserve additional photos
    const existingReviews = await collection.find({}).toArray();
    const existingReviewsMap = new Map();
    existingReviews.forEach(review => {
      existingReviewsMap.set(review.email.toLowerCase(), review);
    });

    // Prepare reviews to insert/update
    const reviewsToUpsert = sheetData.reviews.map(sheetReview => {
      const existingReview = existingReviewsMap.get(sheetReview.email.toLowerCase());
      
      // Preserve additional photos if they exist
      const additionalPhotos = existingReview ? existingReview.additionalPhotos || [] : [];
      
      return {
        timestamp: new Date(sheetReview.timestamp || new Date()),
        name: sheetReview.name,
        email: sheetReview.email,
        rating: sheetReview.rating,
        comment: sheetReview.comment,
        photoUrl: sheetReview.photo_url || '',
        additionalPhotosCount: sheetReview.additional_photos_count || 0,
        additionalPhotos: additionalPhotos, // Preserve existing photos
        status: sheetReview.status || 'Active',
        source: 'google_sheets',
        syncedAt: new Date()
      };
    });

    // Delete all and insert updated reviews
    await collection.deleteMany({});
    if (reviewsToUpsert.length > 0) {
      await collection.insertMany(reviewsToUpsert);
    }

  } catch (error) {
    console.error('Error during sync:', error.message);
  }
}

// Get all reviews from Google Sheets
async function getReviewsFromSheets() {
  try {
    if (!sheets) {
      return { success: false, error: 'Sheets not initialized' };
    }

    const lastColumn = String.fromCharCode(64 + REVIEWS_FIELDS.length);
    const range = `'${REVIEWS_SHEET_NAME}'!A:${lastColumn}`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: REVIEWS_SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length < 2) {
      return { success: true, reviews: [] };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const reviews = dataRows.map((row) => {
      // Skip empty rows
      if (!row[1] && !row[2]) return null;
      
      const review = {};
      headers.forEach((header, colIndex) => {
        review[header.toLowerCase().replace(/ /g, '_')] = row[colIndex] || '';
      });
      
      // Convert rating to number
      review.rating = parseFloat(review.rating) || 0;
      
      // Convert additional photos count to number
      review.additional_photos_count = parseInt(review.additional_photos_count) || 0;
      
      return review;
    }).filter(review => review && review.email);

    return { success: true, reviews };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Submit review - STORE IN BOTH GOOGLE SHEETS AND MONGODB WITH ADDITIONAL PHOTOS
async function submitReview(reviewData) {
  try {
    // Validate required fields
    if (!reviewData.name || !reviewData.email || !reviewData.rating) {
      throw new Error('Missing required fields: name, email, rating');
    }

    let photoUrl = "";
    let additionalPhotos = [];
    let additionalPhotosCount = 0;

    // Handle profile photo
    if (reviewData.photo) {
      if (typeof reviewData.photo === 'string' && reviewData.photo.startsWith('http')) {
        photoUrl = reviewData.photo;
      } else if (reviewData.photo.base64 && typeof reviewData.photo.base64 === 'string') {
        photoUrl = `data:${reviewData.photo.type || 'image/jpeg'};base64,${reviewData.photo.base64}`;
      } else {
        photoUrl = "No photo provided";
      }
    } else {
      photoUrl = "No photo";
    }

    // Handle additional photos - STORE IN MONGODB
    if (reviewData.additionalPhotos && Array.isArray(reviewData.additionalPhotos)) {
      additionalPhotos = reviewData.additionalPhotos.map((photo, index) => {
        if (!photo || typeof photo !== 'object' || !photo.base64) {
          return null;
        }

        return {
          base64: photo.base64,
          name: photo.name || `additional_photo_${index}.jpg`,
          type: photo.type || 'image/jpeg',
          size: photo.base64.length,
          uploadedAt: new Date()
        };
      }).filter(photo => photo !== null);
      
      additionalPhotosCount = additionalPhotos.length;
    }

    // Store in Google Sheets (only count)
    await storeReviewInSheets({
      ...reviewData,
      photoUrl,
      additionalPhotosCount
    });

    // Store in MongoDB (with actual photos)
    await storeReviewInMongoDB({
      ...reviewData,
      photoUrl,
      additionalPhotos,
      additionalPhotosCount,
      status: 'Active'
    });

    return {
      success: true,
      message: 'Review submitted successfully',
      data: {
        name: reviewData.name,
        email: reviewData.email
      }
    };

  } catch (error) {
    throw error;
  }
}

// Store review in MongoDB WITH ADDITIONAL PHOTOS
async function storeReviewInMongoDB(reviewData) {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const reviewDocument = {
      timestamp: new Date(),
      name: reviewData.name,
      email: reviewData.email,
      rating: parseFloat(reviewData.rating),
      comment: reviewData.comment || '',
      photoUrl: reviewData.photoUrl || '',
      additionalPhotos: reviewData.additionalPhotos || [], // Store actual photos
      additionalPhotosCount: reviewData.additionalPhotosCount || 0,
      status: reviewData.status || 'Active',
      source: 'website',
      storedAt: new Date()
    };
    
    const result = await collection.insertOne(reviewDocument);
    return result;
    
  } catch (error) {
    throw error;
  }
}

// Store review in Google Sheets
async function storeReviewInSheets(reviewData) {
  try {
    if (!sheets) {
      await initializeReviewsSheets();
    }

    const additionalPhotosCount = reviewData.additionalPhotosCount || 0;

    const rowData = [
      new Date().toISOString(),
      reviewData.name,
      reviewData.email,
      reviewData.rating,
      reviewData.comment || "",
      reviewData.photoUrl || "No photo",
      additionalPhotosCount.toString(),
      "Active"
    ];

    const lastColumn = String.fromCharCode(64 + REVIEWS_FIELDS.length);
    const range = `'${REVIEWS_SHEET_NAME}'!A:${lastColumn}`;
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: REVIEWS_SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData]
      }
    });

    return response.data;
    
  } catch (error) {
    throw error;
  }
}

// Get all testimonials - INCLUDE ADDITIONAL PHOTOS FROM MONGODB
async function getTestimonials() {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const testimonials = await collection.find({ 
      status: 'Active' 
    })
    .sort({ timestamp: -1 })
    .toArray();

    // Format testimonials for frontend - INCLUDE ADDITIONAL PHOTOS
    const formattedTestimonials = testimonials.map(testimonial => ({
      timestamp: testimonial.timestamp,
      name: testimonial.name,
      email: testimonial.email,
      rating: testimonial.rating,
      comment: testimonial.comment,
      photo: testimonial.photoUrl,
      additionalPhotos: testimonial.additionalPhotos || [], // Include actual photos
      additionalPhotosCount: testimonial.additionalPhotosCount || 0,
      status: testimonial.status,
      source: testimonial.source,
      storedAt: testimonial.storedAt
    }));

    return {
      success: true,
      testimonials: formattedTestimonials,
      count: formattedTestimonials.length
    };
    
  } catch (error) {
    throw error;
  }
}

// Check if user has reviewed
async function checkUserReview(email) {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const existingReview = await collection.findOne({ 
      email: email.toLowerCase(),
      status: 'Active'
    });
    
    return {
      hasReview: !!existingReview,
      message: existingReview ? 'User has already submitted a review' : 'No review found for this email'
    };
    
  } catch (error) {
    throw error;
  }
}

// Get reviews statistics
async function getReviewsStats() {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const photosStats = await collection.aggregate([
      { $match: { status: 'Active' } },
      { 
        $group: { 
          _id: null, 
          totalReviews: { $sum: 1 },
          totalAdditionalPhotos: { $sum: '$additionalPhotosCount' },
          avgRating: { $avg: '$rating' }
        } 
      }
    ]).toArray();
    
    const stats = photosStats.length > 0 ? photosStats[0] : {
      totalReviews: 0,
      totalAdditionalPhotos: 0,
      avgRating: 0
    };
    
    return {
      success: true,
      stats: {
        totalReviews: stats.totalReviews,
        totalAdditionalPhotos: stats.totalAdditionalPhotos,
        averageRating: Math.round(stats.avgRating * 10) / 10,
        lastUpdated: new Date().toISOString()
      }
    };
    
  } catch (error) {
    throw error;
  }
}

module.exports = {
  initializeReviewsSheets,
  submitReview,
  getTestimonials,
  checkUserReview,
  getReviewsStats,
  stopAutoSync
};