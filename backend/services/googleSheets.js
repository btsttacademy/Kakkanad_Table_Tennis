const { google } = require('googleapis');

// Google Sheets configuration
const SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const SHEET_NAME = 'Inquiries';

let sheets;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  try {
    let auth;
    
    // Check if we're in production and have environment variables
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('🔧 Using environment variables for Google Sheets authentication');
      
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
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ],
      });
    } else {
      // Use local credentials.json file for development
      console.log('🔧 Using credentials.json file for Google Sheets authentication');
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ],
      });
    }

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Google Sheets API initialized');
    
    // Setup the sheet
    await setupSheet();
    
    return sheets;
  } catch (error) {
    console.error('❌ Google Sheets initialization error:', error.message);
    
    // Check if it's a credentials file error
    if (error.code === 'ENOENT') {
      console.log('📝 Note: credentials.json not found. Using environment variables or running without Google Sheets.');
    }
    
    throw error;
  }
}

// Setup sheet
async function setupSheet() {
  try {
    console.log(`📋 Setting up sheet: "${SHEET_NAME}"`);
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    console.log('📊 All available sheets:');
    for (let sheet of spreadsheet.data.sheets) {
      console.log(`  - "${sheet.properties.title}"`);
    }

    // Set up headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A1:F1`,
      valueInputOption: 'RAW',
      resource: {
        values: [
          ['Timestamp', 'Name', 'Phone Number', 'Question', 'Status', 'MongoDB_ID']
        ]
      }
    });

    console.log('✅ Sheet setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up sheet:', error.message);
    throw error;
  }
}

// Add data to Google Sheets
async function addToGoogleSheets(data, mongoId) {
  try {
    // If sheets is not initialized, try to initialize it first
    if (!sheets) {
      await initializeGoogleSheets();
    }

    const timestamp = new Date().toLocaleString();
    
    const rowData = [
      timestamp,
      data.name,
      data.phoneNumber,
      data.question,
      'New',
      mongoId ? mongoId.toString() : 'N/A'
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:F`,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData],
      },
    });

    console.log('✅ Data added to Google Sheets');
    return response.data;
  } catch (error) {
    console.error('❌ Error adding to Google Sheets:', error.message);
    throw error;
  }
}

module.exports = {
  initializeGoogleSheets,
  addToGoogleSheets,
  setupSheet
};