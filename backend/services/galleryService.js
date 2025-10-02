const { google } = require('googleapis');
const { getDatabase } = require('../config/database');

// Google Sheets configuration for gallery
const GALLERY_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM'; // Your spreadsheet ID
const GALLERY_SHEET_NAME = 'ImageGalleryData';

let sheets;

// Initialize Google Sheets for gallery
async function initializeGallerySheets() {
  try {
    let auth;
    
    // Check if we're in production and have environment variables
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('🔧 Using environment variables for Gallery Google Sheets authentication');
      
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
      // Use local credentials.json file for development
      console.log('🔧 Using credentials.json file for Gallery Google Sheets authentication');
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Gallery Google Sheets API initialized');
    return sheets;
  } catch (error) {
    console.error('❌ Gallery Sheets initialization error:', error.message);
    
    // Check if it's a credentials file error
    if (error.code === 'ENOENT') {
      console.log('📝 Note: credentials.json not found. Using environment variables or running without Google Sheets.');
    }
    
    throw error;
  }
}

// Get gallery data directly from Google Sheets
async function getGalleryDataFromSheets() {
  try {
    console.log('🔄 Fetching gallery data from Google Sheets...');
    
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeGallerySheets();
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GALLERY_SPREADSHEET_ID,
      range: `'${GALLERY_SHEET_NAME}'!A:C`, // Only Image No and Image URL columns
    });

    const rows = response.data.values;
    
    if (!rows || rows.length < 2) {
      console.log('⚠️ No gallery data found in sheet');
      return {
        success: true,
        data: [],
        totalImages: 0,
        source: 'google_sheets'
      };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const gallery = dataRows.map((row, index) => {
      // Skip empty rows or rows without image URL
      if (!row[1] || row[1].toString().trim() === '') return null;
      
      return {
        imageNo: parseInt(row[0]) || index + 1,
        imageUrl: row[1].toString().trim(),
        fileName: `Image ${parseInt(row[0]) || index + 1}`
      };
    }).filter(item => item !== null);

    console.log(`✅ Retrieved ${gallery.length} images from Google Sheets`);
    
    return {
      success: true,
      data: gallery,
      totalImages: gallery.length,
      source: 'google_sheets',
      lastSync: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error getting gallery from sheets:', error.message);
    throw error;
  }
}

// Simple function to get gallery data (only from Google Sheets)
async function getGalleryData() {
  try {
    const result = await getGalleryDataFromSheets();
    return result;
  } catch (error) {
    console.error('❌ Error getting gallery data:', error.message);
    
    // Return empty gallery as fallback
    return {
      success: true,
      data: [],
      totalImages: 0,
      source: 'error_fallback',
      message: 'Failed to load gallery data'
    };
  }
}

// Test gallery connection
async function testGalleryConnection() {
  try {
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeGallerySheets();
    }

    // Test Google Sheets connection
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: GALLERY_SPREADSHEET_ID,
    });
    
    // Test getting gallery data
    const galleryData = await getGalleryData();
    
    return {
      success: true,
      message: 'Gallery service is connected',
      googleSheets: {
        connected: true,
        spreadsheetTitle: sheetsResponse.data.properties.title,
        sheetName: GALLERY_SHEET_NAME
      },
      gallery: {
        totalImages: galleryData.totalImages,
        source: galleryData.source
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Gallery service connection failed: ' + error.message
    };
  }
}

// Add image to gallery (admin function)
async function addImageToGallery(imageData) {
  try {
    console.log('📝 Adding image to gallery...');
    
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeGallerySheets();
    }

    const rowData = [
      imageData.imageNo || '',
      imageData.imageUrl || '',
      imageData.description || ''
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GALLERY_SPREADSHEET_ID,
      range: `'${GALLERY_SHEET_NAME}'!A:C`,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData]
      }
    });

    console.log('✅ Image added to gallery successfully');
    return {
      success: true,
      message: 'Image added to gallery successfully',
      data: response.data
    };
    
  } catch (error) {
    console.error('❌ Error adding image to gallery:', error.message);
    return {
      success: false,
      message: 'Failed to add image to gallery: ' + error.message
    };
  }
}

// Refresh gallery data (force fresh fetch)
async function refreshGallery() {
  try {
    console.log('🔄 Force refreshing gallery data...');
    
    const result = await getGalleryDataFromSheets();
    
    return {
      ...result,
      refreshed: true,
      message: 'Gallery data refreshed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error refreshing gallery:', error.message);
    return {
      success: false,
      message: 'Failed to refresh gallery: ' + error.message
    };
  }
}

module.exports = {
  initializeGallerySheets,
  getGalleryData,
  testGalleryConnection,
  addImageToGallery,
  refreshGallery
};