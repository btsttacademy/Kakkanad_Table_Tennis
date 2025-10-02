const { google } = require('googleapis');
const { getDatabase } = require('../config/database');

// Google Sheets configuration for web content
const WEB_CONTENT_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const WEB_CONTENT_SHEET_NAME = 'Website edit content';

let sheets;
let cachedContent = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Web content fields definition
const WEB_CONTENT_FIELDS = [
  'MainHeading', 'MainDescription', 'AboutHeading', 'AboutDescription',
  'dh1', 'dd1', 'dh2', 'dd2', 'coaching', 'coachingDes',
  'Groupcoaching', 'GroupcoachingDes', 'oneTimeCharge', 
  'Timingh1', 'Timingd1', 'Timingh2', 'Timingd2',
  'mainBG', 'mainBGmb', 'img1', 'img2', 'img3'
];

// Initialize Google Sheets for web content
async function initializeWebContentSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Web Content Google Sheets API initialized');
    
    // Setup the web content sheet
    await setupWebContentSheet();
    
    return sheets;
  } catch (error) {
    console.error('❌ Web Content Sheets initialization error:', error);
    throw error;
  }
}

// Setup web content sheet
async function setupWebContentSheet() {
  try {
    console.log(`📋 Setting up web content sheet: "${WEB_CONTENT_SHEET_NAME}"`);
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
    });

    console.log('📊 All available sheets in web content spreadsheet:');
    for (let sheet of spreadsheet.data.sheets) {
      console.log(`  - "${sheet.properties.title}"`);
    }

    // Calculate the correct range (21 columns = A to U)
    const lastColumn = String.fromCharCode(64 + WEB_CONTENT_FIELDS.length); // A=65, U=85
    const range = `'${WEB_CONTENT_SHEET_NAME}'!A1:${lastColumn}1`;
    
    console.log(`📝 Setting up headers in range: ${range}`);

    try {
      // Set up headers for web content
      await sheets.spreadsheets.values.update({
        spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: [WEB_CONTENT_FIELDS]
        }
      });
      console.log('✅ Web content headers set successfully');
    } catch (headerError) {
      // If headers already exist, that's fine
      if (headerError.message.includes('INVALID_ARGUMENT')) {
        console.log('⚠️ Headers may already exist, continuing...');
      } else {
        throw headerError;
      }
    }

    console.log('✅ Web content sheet setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up web content sheet:', error.message);
    throw error;
  }
}

// Get web content from Google Sheets
async function getWebContentFromSheets() {
  try {
    console.log('🔄 Fetching web content from Google Sheets...');
    
    const lastColumn = String.fromCharCode(64 + WEB_CONTENT_FIELDS.length);
    const range = `'${WEB_CONTENT_SHEET_NAME}'!A:${lastColumn}`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length < 2) {
      throw new Error('No web content found in sheet. Please add data to Row 2.');
    }

    const headers = rows[0];
    const content = rows[1];

    // Convert to object with key-value pairs
    const result = {};
    headers.forEach((header, index) => {
      result[header] = content[index] || '';
    });

    console.log('✅ Web content fetched successfully from Google Sheets');
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching web content from sheets:', error.message);
    throw error;
  }
}

// Store web content in MongoDB
async function storeWebContentInMongoDB(content) {
  try {
    const db = getDatabase();
    const collection = db.collection('web_content');
    
    // Update or insert web content
    await collection.updateOne(
      { _id: 'current_content' },
      { 
        $set: { 
          ...content,
          lastUpdated: new Date(),
          source: 'google_sheets'
        }
      },
      { upsert: true }
    );
    
    console.log('✅ Web content stored in MongoDB');
    
  } catch (error) {
    console.error('❌ Error storing web content in MongoDB:', error.message);
    throw error;
  }
}

// Get web content from MongoDB
async function getWebContentFromMongoDB() {
  try {
    const db = getDatabase();
    const collection = db.collection('web_content');
    
    const content = await collection.findOne({ _id: 'current_content' });
    
    if (!content) {
      throw new Error('No web content found in database');
    }
    
    // Remove MongoDB-specific fields before returning
    const { _id, ...cleanContent } = content;
    return cleanContent;
    
  } catch (error) {
    console.error('❌ Error fetching web content from MongoDB:', error.message);
    throw error;
  }
}

// Main function to get web content (with caching)
async function getWebContent() {
  try {
    // Return cached content if it's still valid
    if (cachedContent && lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      console.log('📦 Returning cached web content');
      return {
        success: true,
        data: cachedContent,
        cached: true,
        cacheTimestamp: lastFetchTime,
        source: 'cache'
      };
    }

    console.log('🔄 Fetching fresh web content...');
    
    let content;
    let source = 'google_sheets';
    
    try {
      // Try to get from Google Sheets first
      content = await getWebContentFromSheets();
      
      // Store in MongoDB for backup
      await storeWebContentInMongoDB(content);
      
    } catch (sheetsError) {
      console.log('🔄 Google Sheets unavailable, trying MongoDB...');
      
      // Fallback to MongoDB
      content = await getWebContentFromMongoDB();
      source = 'mongodb';
    }

    // Cache the content
    cachedContent = content;
    lastFetchTime = Date.now();
    
    console.log(`✅ Web content fetched successfully from ${source}`);
    return {
      success: true,
      data: content,
      cached: false,
      cacheTimestamp: lastFetchTime,
      source: source
    };
    
  } catch (error) {
    console.error('❌ Error fetching web content:', error.message);
    
    // Return cached content even if it's stale as fallback
    if (cachedContent) {
      console.log('🔄 Returning stale cached content as fallback');
      return {
        success: true,
        data: cachedContent,
        cached: true,
        stale: true,
        error: error.message,
        cacheTimestamp: lastFetchTime,
        source: 'cache_fallback'
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch web content: ' + error.message
    };
  }
}

// Force refresh web content (bypass cache)
async function refreshWebContent() {
  try {
    console.log('🔄 Force refreshing web content...');
    
    // Clear cache
    cachedContent = null;
    lastFetchTime = null;
    
    let content;
    let source = 'google_sheets';
    
    try {
      // Get fresh data from Google Sheets
      content = await getWebContentFromSheets();
      
      // Store in MongoDB
      await storeWebContentInMongoDB(content);
      
    } catch (sheetsError) {
      console.log('🔄 Google Sheets unavailable, using MongoDB...');
      content = await getWebContentFromMongoDB();
      source = 'mongodb';
    }

    // Update cache
    cachedContent = content;
    lastFetchTime = Date.now();
    
    console.log(`✅ Web content refreshed successfully from ${source}`);
    return {
      success: true,
      data: content,
      cached: false,
      cacheTimestamp: lastFetchTime,
      source: source,
      refreshed: true
    };
    
  } catch (error) {
    console.error('❌ Error refreshing web content:', error.message);
    return {
      success: false,
      message: 'Failed to refresh web content: ' + error.message
    };
  }
}

// Update web content (admin function)
async function updateWebContent(updates) {
  try {
    console.log('📝 Updating web content...');
    
    // Update Google Sheets
    const rowData = WEB_CONTENT_FIELDS.map(header => updates[header] || '');
    const lastColumn = String.fromCharCode(64 + WEB_CONTENT_FIELDS.length);
    const range = `'${WEB_CONTENT_SHEET_NAME}'!A2:${lastColumn}2`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData]
      }
    });
    
    // Update MongoDB
    await storeWebContentInMongoDB(updates);
    
    // Clear cache
    cachedContent = null;
    lastFetchTime = null;
    
    console.log('✅ Web content updated successfully');
    return {
      success: true,
      message: 'Web content updated successfully',
      updatedFields: Object.keys(updates)
    };
    
  } catch (error) {
    console.error('❌ Error updating web content:', error.message);
    return {
      success: false,
      message: 'Failed to update web content: ' + error.message
    };
  }
}

// Test web content connection
async function testWebContentConnection() {
  try {
    // Test Google Sheets connection
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
    });
    
    // Test MongoDB connection
    const db = getDatabase();
    await db.command({ ping: 1 });
    
    // Try to get current data
    let currentData = null;
    try {
      const contentResponse = await getWebContentFromSheets();
      currentData = contentResponse;
    } catch (dataError) {
      console.log('No data in sheet yet, but connection is working');
    }
    
    return {
      success: true,
      message: 'Web content service is connected',
      googleSheets: {
        connected: true,
        spreadsheetTitle: sheetsResponse.data.properties.title,
        sheetName: WEB_CONTENT_SHEET_NAME,
        hasData: !!currentData
      },
      mongodb: {
        connected: true,
        database: 'testdb'
      },
      currentData: currentData
    };
    
  } catch (error) {
    console.error('❌ Web content connection test failed:', error.message);
    return {
      success: false,
      message: 'Web content service connection failed: ' + error.message,
      error: error.message
    };
  }
}

// Get available fields
function getAvailableFields() {
  return {
    success: true,
    availableFields: WEB_CONTENT_FIELDS,
    description: "These fields can be edited in the Google Sheet 'Website edit content'",
    note: "Edit the data in Row 2 of the sheet. Row 1 contains headers."
  };
}

// Debug function to check sheet data
async function debugSheetData() {
  try {
    const lastColumn = String.fromCharCode(64 + WEB_CONTENT_FIELDS.length);
    const range = `'${WEB_CONTENT_SHEET_NAME}'!A:${lastColumn}`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    
    console.log('🔍 Debug - Sheet data:');
    console.log('Total rows:', rows ? rows.length : 0);
    
    if (rows && rows.length > 0) {
      console.log('Headers:', rows[0]);
      if (rows.length > 1) {
        console.log('Data row:', rows[1]);
      }
    }
    
    return {
      success: true,
      rowCount: rows ? rows.length : 0,
      headers: rows && rows.length > 0 ? rows[0] : [],
      data: rows && rows.length > 1 ? rows[1] : []
    };
    
  } catch (error) {
    console.error('Debug error:', error.message);
    return {
      success: false,
      message: 'Debug failed: ' + error.message
    };
  }
}

// Add this to webContentService.js if needed
async function forceRefresh() {
  try {
    console.log('🔄 Force refreshing web content...');
    
    // Clear any cache
    cachedContent = null;
    lastFetchTime = null;
    
    // Get fresh data
    const result = await getWebContent();
    
    return {
      ...result,
      forceRefreshed: true,
      message: 'Web content force refreshed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error in force refresh:', error.message);
    return {
      success: false,
      message: 'Force refresh failed: ' + error.message
    };
  }
}

module.exports = {
  initializeWebContentSheets,
  getWebContent,
  refreshWebContent,
  forceRefresh,  // Add this
  updateWebContent,
  testWebContentConnection,
  getAvailableFields,
  debugSheetData
};

