const { google } = require('googleapis');

// Google Sheets configuration
const WEB_CONTENT_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const WEB_CONTENT_SHEET_NAME = 'Website edit content';

let sheets;
let cachedContent = null;
let lastFetchTime = null;
const CACHE_DURATION = 10 * 1000; // 2 minutes cache

// Web content fields definition
const WEB_CONTENT_FIELDS = [
  'MainHeading', 'MainDescription', 'AboutHeading', 'AboutDescription',
  'dh1', 'dd1', 'dh2', 'dd2', 'coaching', 'coachingDes',
  'Groupcoaching', 'GroupcoachingDes', 'oneTimeCharge', 
  'Timingh1', 'Timingd1', 'Timingh2', 'Timingd2',
  'mainBG', 'mainBGmb', 'img1', 'img2', 'img3'
];

// Initialize Google Sheets
async function initializeSheets() {
  try {
    let auth;
    
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('🔧 Using environment variables for Google Sheets');
      
      const credentials = {
        type: 'service_account',
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL || 'bts-sheets-and-drive@bts-tt-academy.iam.gserviceaccount.com',
      };

      auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      console.log('🔧 Using credentials.json for Google Sheets');
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Google Sheets API initialized');
    
    // Initial content fetch
    await getFreshContent();
    
    return sheets;
  } catch (error) {
    console.error('❌ Sheets initialization error:', error.message);
    throw error;
  }
}

// Get fresh content from Google Sheets
async function getFreshContent() {
  try {
    console.log('🔄 Fetching fresh content from Google Sheets...');
    
    if (!sheets) {
      await initializeSheets();
    }

    const lastColumn = String.fromCharCode(64 + WEB_CONTENT_FIELDS.length);
    const range = `'${WEB_CONTENT_SHEET_NAME}'!A:${lastColumn}`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length < 2) {
      throw new Error('No content found. Please add data to Row 2 in Google Sheets.');
    }

    const headers = rows[0];
    const content = rows[1];

    // Convert to object
    const result = {};
    headers.forEach((header, index) => {
      result[header] = content[index] || '';
    });

    console.log('✅ Content fetched successfully from Google Sheets');
    return result;
  } catch (error) {
    console.error('❌ Error fetching from sheets:', error.message);
    throw error;
  }
}

// Main function to get web content with automatic sync
async function getWebContent() {
  try {
    const now = Date.now();
    const isCacheExpired = !lastFetchTime || (now - lastFetchTime) > CACHE_DURATION;
    
    // If cache is expired or doesn't exist, fetch fresh data
    if (!cachedContent || isCacheExpired) {
      console.log('🔄 Cache expired or missing, fetching fresh content...');
      const freshContent = await getFreshContent();
      
      // Update cache
      cachedContent = freshContent;
      lastFetchTime = now;
      
      return {
        success: true,
        data: cachedContent,
        cached: false,
        timestamp: lastFetchTime,
        message: 'Fresh content loaded from Google Sheets'
      };
    }
    
    // Return cached content
    return {
      success: true,
      data: cachedContent,
      cached: true,
      timestamp: lastFetchTime,
      message: 'Content served from cache'
    };
  } catch (error) {
    console.error('❌ Error getting web content:', error.message);
    
    // Return cached content as fallback (even if stale)
    if (cachedContent) {
      console.log('🔄 Returning stale cached content as fallback');
      return {
        success: true,
        data: cachedContent,
        cached: true,
        stale: true,
        error: error.message,
        timestamp: lastFetchTime,
        message: 'Serving stale cache due to error: ' + error.message
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch web content: ' + error.message
    };
  }
}

// Force refresh (bypass cache)
async function refreshWebContent() {
  try {
    console.log('🔄 Force refreshing content...');
    
    const content = await getFreshContent();
    
    // Update cache
    cachedContent = content;
    lastFetchTime = Date.now();
    
    return {
      success: true,
      data: content,
      cached: false,
      timestamp: lastFetchTime,
      refreshed: true,
      message: 'Content forcefully refreshed from Google Sheets'
    };
  } catch (error) {
    console.error('❌ Error refreshing content:', error.message);
    return {
      success: false,
      message: 'Failed to refresh content: ' + error.message
    };
  }
}

// Get specific field value
function getFieldValue(fieldName) {
  if (!cachedContent) {
    return null;
  }
  return cachedContent[fieldName] || null;
}

// Get all available fields
function getAvailableFields() {
  return WEB_CONTENT_FIELDS;
}

// Get current cache status
function getCacheStatus() {
  return {
    hasCache: !!cachedContent,
    lastFetchTime: lastFetchTime,
    isCacheValid: lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION,
    cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null
  };
}

// Test connection
async function testConnection() {
  try {
    if (!sheets) {
      await initializeSheets();
    }

    const response = await sheets.spreadsheets.get({
      spreadsheetId: WEB_CONTENT_SPREADSHEET_ID,
    });
    
    return {
      success: true,
      message: 'Google Sheets connection successful',
      spreadsheetTitle: response.data.properties.title,
      cacheStatus: getCacheStatus()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Connection failed: ' + error.message
    };
  }
}

module.exports = {
  initializeSheets,
  getWebContent,
  refreshWebContent,
  getFieldValue,
  getAvailableFields,
  getCacheStatus,
  testConnection
};