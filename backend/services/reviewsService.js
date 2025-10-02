const { google } = require('googleapis');
const { getDatabase } = require('../config/database');

// Google Sheets configuration for reviews
const REVIEWS_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const REVIEWS_SHEET_NAME = 'Reviews';

let sheets;
let syncInterval;

// Reviews fields definition - UPDATED: Remove additional photos URLs, add count
const REVIEWS_FIELDS = [
  'Timestamp', 'Name', 'Email', 'Rating', 'Comment', 
  'Photo URL', 'Additional Photos Count', 'Status'
];

// Setup reviews sheet
async function setupReviewsSheet() {
  try {
    console.log(`📋 Setting up reviews sheet: "${REVIEWS_SHEET_NAME}"`);
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: REVIEWS_SPREADSHEET_ID,
    });

    console.log('📊 All available sheets in reviews spreadsheet:');
    for (let sheet of spreadsheet.data.sheets) {
      console.log(`  - "${sheet.properties.title}"`);
    }

    // Calculate the correct range
    const lastColumn = String.fromCharCode(64 + REVIEWS_FIELDS.length);
    const range = `'${REVIEWS_SHEET_NAME}'!A1:${lastColumn}1`;
    
    console.log(`📝 Setting up headers in range: ${range}`);

    // Set up headers for reviews
    await sheets.spreadsheets.values.update({
      spreadsheetId: REVIEWS_SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: [REVIEWS_FIELDS]
      }
    });

    console.log('✅ Reviews sheet setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up reviews sheet:', error.message);
    
    // If headers already exist, that's fine - just log and continue
    if (error.message.includes('INVALID_ARGUMENT')) {
      console.log('⚠️ Headers may already exist, continuing...');
      return;
    }
    
    throw error;
  }
}

// Initialize Google Sheets for reviews
async function initializeReviewsSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Reviews Google Sheets API initialized');
    
    // Setup the reviews sheet
    await setupReviewsSheet();
    
    // Start auto-sync
    startAutoSync();
    
    return sheets;
  } catch (error) {
    console.error('❌ Reviews Sheets initialization error:', error);
    throw error;
  }
}

// Start automatic synchronization
function startAutoSync() {
  // Sync every 30 seconds
  syncInterval = setInterval(syncSheetsToMongoDB, 30000);
  console.log('🔄 Auto-sync started (every 30 seconds)');
}

// Stop automatic synchronization
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    console.log('🛑 Auto-sync stopped');
  }
}

// Synchronize Google Sheets data to MongoDB
async function syncSheetsToMongoDB() {
  try {
    console.log('🔄 Syncing Google Sheets data to MongoDB...');
    
    const sheetData = await getReviewsFromSheets();
    const mongoData = await getReviewsFromMongoDB();
    
    if (!sheetData.success || !sheetData.reviews) {
      console.log('❌ No data found in Google Sheets for sync');
      return;
    }

    let created = 0;
    let updated = 0;
    let deleted = 0;

    // Create a map of MongoDB reviews by email for quick lookup
    const mongoReviewsMap = new Map();
    mongoData.forEach(review => {
      mongoReviewsMap.set(review.email.toLowerCase(), review);
    });

    // Sync from Sheets to MongoDB
    for (const sheetReview of sheetData.reviews) {
      const existingReview = mongoReviewsMap.get(sheetReview.email.toLowerCase());
      
      if (existingReview) {
        // Update existing review
        if (needsUpdate(existingReview, sheetReview)) {
          await updateReviewInMongoDB(sheetReview);
          updated++;
        }
        // Remove from map to track which ones still exist
        mongoReviewsMap.delete(sheetReview.email.toLowerCase());
      } else {
        // Create new review
        await createReviewFromSheets(sheetReview);
        created++;
      }
    }

    // Delete reviews that are in MongoDB but not in Sheets
    for (const [email, review] of mongoReviewsMap) {
      await softDeleteReviewInMongoDB(review._id);
      deleted++;
    }

    if (created > 0 || updated > 0 || deleted > 0) {
      console.log(`✅ Sync completed: ${created} created, ${updated} updated, ${deleted} soft-deleted`);
    } else {
      console.log('✅ Sync completed: No changes needed');
    }

  } catch (error) {
    console.error('❌ Error during sync:', error.message);
  }
}

// Check if a review needs to be updated
function needsUpdate(mongoReview, sheetReview) {
  return (
    mongoReview.name !== sheetReview.name ||
    mongoReview.rating !== sheetReview.rating ||
    mongoReview.comment !== sheetReview.comment ||
    mongoReview.photoUrl !== sheetReview.photo_url ||
    mongoReview.status !== sheetReview.status
  );
}

// Get all reviews from Google Sheets
async function getReviewsFromSheets() {
  try {
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

    const reviews = dataRows.map((row, index) => {
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
    console.error('❌ Error getting reviews from sheets:', error.message);
    return { success: false, error: error.message };
  }
}

// Get all reviews from MongoDB
async function getReviewsFromMongoDB() {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    return await collection.find({ 
      status: { $ne: 'Deleted' } 
    }).toArray();
    
  } catch (error) {
    console.error('❌ Error getting reviews from MongoDB:', error.message);
    return [];
  }
}

// Create review in MongoDB from Sheets data
async function createReviewFromSheets(sheetReview) {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const reviewDocument = {
      timestamp: new Date(sheetReview.timestamp || new Date()),
      name: sheetReview.name,
      email: sheetReview.email,
      rating: sheetReview.rating,
      comment: sheetReview.comment,
      photoUrl: sheetReview.photo_url || '',
      additionalPhotosCount: sheetReview.additional_photos_count || 0,
      additionalPhotos: [], // Empty array for sheets-synced reviews
      status: sheetReview.status || 'Active',
      source: 'google_sheets_sync',
      syncedAt: new Date()
    };
    
    await collection.insertOne(reviewDocument);
    console.log(`✅ Created review in MongoDB for: ${sheetReview.email}`);
    
  } catch (error) {
    console.error('❌ Error creating review from sheets:', error.message);
  }
}

// Update review in MongoDB
async function updateReviewInMongoDB(sheetReview) {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    await collection.updateOne(
      { email: sheetReview.email.toLowerCase() },
      {
        $set: {
          name: sheetReview.name,
          rating: sheetReview.rating,
          comment: sheetReview.comment,
          photoUrl: sheetReview.photo_url || '',
          additionalPhotosCount: sheetReview.additional_photos_count || 0,
          status: sheetReview.status || 'Active',
          source: 'google_sheets_sync',
          syncedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated review in MongoDB for: ${sheetReview.email}`);
    
  } catch (error) {
    console.error('❌ Error updating review in MongoDB:', error.message);
  }
}

// Soft delete review in MongoDB (mark as deleted instead of actually deleting)
async function softDeleteReviewInMongoDB(reviewId) {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    await collection.updateOne(
      { _id: reviewId },
      {
        $set: {
          status: 'Deleted',
          deletedAt: new Date(),
          syncedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Soft-deleted review in MongoDB: ${reviewId}`);
    
  } catch (error) {
    console.error('❌ Error soft-deleting review in MongoDB:', error.message);
  }
}

// Manual sync trigger
async function manualSync() {
  console.log('🔄 Manual sync triggered...');
  await syncSheetsToMongoDB();
}

// Force refresh all data (for frontend)
async function forceRefresh() {
  console.log('🔄 Force refresh triggered...');
  await syncSheetsToMongoDB();
  return await getTestimonials();
}

// Submit review - STORE ADDITIONAL PHOTOS IN MONGODB AS BASE64
async function submitReview(reviewData) {
  try {
    console.log('📝 Submitting review...');
    
    // Validate required fields
    if (!reviewData.name || !reviewData.email || !reviewData.rating) {
      throw new Error('Missing required fields: name, email, rating');
    }

    // Check for duplicate email
    const hasDuplicate = await checkDuplicateEmail(reviewData.email);
    if (hasDuplicate) {
      throw new Error('This email has already submitted a review');
    }

    let photoUrl = "";
    let additionalPhotos = [];
    let additionalPhotosCount = 0;

    // Handle profile photo - KEEP AS-IS
    if (reviewData.photo) {
      if (typeof reviewData.photo === 'string' && reviewData.photo.startsWith('http')) {
        console.log("Using Google profile photo URL directly");
        photoUrl = reviewData.photo;
      } else if (reviewData.photo.base64 && typeof reviewData.photo.base64 === 'string') {
        console.log("Storing profile photo as base64");
        photoUrl = `data:${reviewData.photo.type || 'image/jpeg'};base64,${reviewData.photo.base64}`;
      } else {
        console.log('Unknown photo format');
        photoUrl = "No photo provided";
      }
    } else {
      console.log('No profile photo provided');
      photoUrl = "No photo";
    }

    // Handle additional photos - STORE AS BASE64 IN MONGODB
    if (reviewData.additionalPhotos && Array.isArray(reviewData.additionalPhotos)) {
      console.log(`Processing ${reviewData.additionalPhotos.length} additional photos for MongoDB storage`);
      
      additionalPhotos = reviewData.additionalPhotos.map((photo, index) => {
        if (!photo || typeof photo !== 'object' || !photo.base64) {
          console.error(`Invalid photo object at index ${index}`);
          return null;
        }

        try {
          console.log(`📸 Storing additional photo ${index+1} in MongoDB`);
          
          // Store complete photo data as base64 in MongoDB
          return {
            base64: photo.base64,
            name: photo.name || `additional_photo_${index}.jpg`,
            type: photo.type || 'image/jpeg',
            size: photo.base64.length,
            uploadedAt: new Date()
          };
          
        } catch (error) {
          console.error(`❌ Error processing additional photo ${index+1}:`, error.message);
          return null;
        }
      }).filter(photo => photo !== null);
      
      additionalPhotosCount = additionalPhotos.length;
      console.log(`✅ Successfully stored ${additionalPhotosCount} additional photos in MongoDB`);
    } else {
      console.log('No additional photos provided');
    }

    console.log('📊 Storage results:', {
      profilePhoto: photoUrl ? '✅' : '❌',
      additionalPhotos: {
        storedInMongoDB: additionalPhotosCount,
        totalProcessed: additionalPhotosCount
      }
    });

    // Store in MongoDB (with base64 photos)
    const mongoResult = await storeReviewInMongoDB({
      ...reviewData,
      photoUrl,
      additionalPhotos, // Store full base64 data in MongoDB
      additionalPhotosCount,
      status: 'Active'
    });

    // Store in Google Sheets (only count, no URLs)
    const sheetsResult = await storeReviewInSheets({
      ...reviewData,
      photoUrl,
      additionalPhotosCount
    });

    console.log('✅ Review submitted successfully');
    
    return {
      success: true,
      message: 'Review submitted successfully',
      data: {
        name: reviewData.name,
        email: reviewData.email,
        photos: {
          profile: photoUrl ? 'Processed' : 'None',
          additional: {
            storedInMongoDB: additionalPhotosCount,
            total: additionalPhotosCount
          }
        },
        storage: {
          mongodb: '✅ Photos stored as base64',
          googleSheets: '✅ Count stored'
        }
      }
    };

  } catch (error) {
    console.error('❌ Error submitting review:', error.message);
    throw error;
  }
}

// Store review in MongoDB WITH BASE64 PHOTOS
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
      additionalPhotos: reviewData.additionalPhotos || [], // Store base64 photos array
      additionalPhotosCount: reviewData.additionalPhotosCount || 0,
      status: reviewData.status || 'Active',
      source: 'website',
      storedAt: new Date()
    };
    
    const result = await collection.insertOne(reviewDocument);
    console.log('✅ Review stored in MongoDB with base64 photos');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error storing review in MongoDB:', error.message);
    throw error;
  }
}

// Store review in Google Sheets - ONLY COUNT, NO URLS
async function storeReviewInSheets(reviewData) {
  try {
    const additionalPhotosCount = reviewData.additionalPhotosCount || 0;

    const rowData = [
      new Date().toISOString(),
      reviewData.name,
      reviewData.email,
      reviewData.rating,
      reviewData.comment || "",
      reviewData.photoUrl || "No photo",
      additionalPhotosCount.toString(), // Store count as string
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

    console.log('✅ Review stored in Google Sheets (photos count only)');
    return response.data;
    
  } catch (error) {
    console.error('❌ Error storing review in Google Sheets:', error.message);
    throw error;
  }
}

// Check for duplicate email
async function checkDuplicateEmail(email) {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const existingReview = await collection.findOne({ 
      email: email.toLowerCase(),
      status: { $ne: 'Deleted' }
    });
    
    return !!existingReview;
    
  } catch (error) {
    console.error('❌ Error checking duplicate email:', error.message);
    throw error;
  }
}

// Get all testimonials (only active ones) - INCLUDE BASE64 PHOTOS FROM MONGODB
async function getTestimonials() {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const testimonials = await collection.find({ 
      status: 'Active' 
    })
    .sort({ timestamp: -1 })
    .toArray();

    // Format testimonials for frontend - INCLUDE BASE64 PHOTOS
    const formattedTestimonials = testimonials.map(testimonial => ({
      timestamp: testimonial.timestamp,
      name: testimonial.name,
      email: testimonial.email,
      rating: testimonial.rating,
      comment: testimonial.comment,
      photo: testimonial.photoUrl, // Keep original photo URL
      additionalPhotos: testimonial.additionalPhotos || [], // Include base64 photos from MongoDB
      additionalPhotosCount: testimonial.additionalPhotosCount || 0,
      status: testimonial.status
    }));

    console.log(`✅ Retrieved ${formattedTestimonials.length} active testimonials with base64 photos`);
    
    return {
      success: true,
      testimonials: formattedTestimonials,
      count: formattedTestimonials.length
    };
    
  } catch (error) {
    console.error('❌ Error getting testimonials:', error.message);
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
    console.error('❌ Error checking user review:', error.message);
    throw error;
  }
}

// Get reviews statistics
async function getReviewsStats() {
  try {
    const db = getDatabase();
    const collection = db.collection('reviews');
    
    const totalReviews = await collection.countDocuments({ status: 'Active' });
    
    // Get total additional photos across all reviews
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
    console.error('❌ Error getting reviews stats:', error.message);
    throw error;
  }
}

// Test MongoDB photo storage
async function testMongoDBStorage() {
  try {
    console.log('🧪 Testing MongoDB photo storage...');
    
    const testReview = {
      name: "MongoDB Storage Test",
      email: `testmongo${Date.now()}@example.com`,
      rating: 5,
      comment: "Testing base64 photo storage in MongoDB",
      photo: "https://lh3.googleusercontent.com/a/ACg8ocJ7-xTLFIBdForriPoeeyMyyJUQRaN0oFjQaqq4GV1XytgYG2w=s96-c",
      additionalPhotos: [
        {
          base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          name: "test_photo_1.jpg",
          type: "image/jpeg"
        },
        {
          base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          name: "test_photo_2.jpg",
          type: "image/jpeg"
        }
      ]
    };

    const result = await submitReview(testReview);
    console.log('✅ MongoDB storage test successful:', result);
    return result;
  } catch (error) {
    console.error('❌ MongoDB storage test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test reviews connection
async function testReviewsConnection() {
  try {
    // Test Google Sheets connection
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: REVIEWS_SPREADSHEET_ID,
    });
    
    // Test MongoDB connection
    const db = getDatabase();
    await db.command({ ping: 1 });
    
    return {
      success: true,
      message: 'Reviews service is connected',
      googleSheets: {
        connected: true,
        spreadsheetTitle: sheetsResponse.data.properties.title,
        sheetName: REVIEWS_SHEET_NAME,
        storage: 'Photos count only'
      },
      mongodb: {
        connected: true,
        database: 'testdb',
        storage: 'Base64 photos storage'
      },
      autoSync: 'Active (30 second intervals)'
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Reviews service connection failed: ' + error.message
    };
  }
}

module.exports = {
  initializeReviewsSheets,
  submitReview,
  getTestimonials,
  checkUserReview,
  getReviewsStats,
  testReviewsConnection,
  testMongoDBStorage,
  manualSync,
  forceRefresh,
  stopAutoSync
};