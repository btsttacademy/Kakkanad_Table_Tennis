const { google } = require('googleapis');
const { getDatabase } = require('../config/database');

// Google Sheets configuration for gallery
const GALLERY_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM'; // Your spreadsheet ID
const GALLERY_SHEET_NAME = 'ImageGalleryData';

let sheets;

// Initialize Google Sheets for gallery
async function initializeGallerySheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Gallery Google Sheets API initialized');
    return sheets;
  } catch (error) {
    console.error('❌ Gallery Sheets initialization error:', error);
    throw error;
  }
}

// Get gallery data directly from Google Sheets
async function getGalleryDataFromSheets() {
  try {
    console.log('🔄 Fetching gallery data from Google Sheets...');
    
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

module.exports = {
  initializeGallerySheets,
  getGalleryData,
  testGalleryConnection
};