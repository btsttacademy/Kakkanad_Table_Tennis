const { google } = require('googleapis');

// Google Sheets configuration
const SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const SHEET_NAME = 'Inquiries';

let sheets;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Google Sheets API initialized');
    
    // Setup the sheet
    await setupSheet();
    
    return sheets;
  } catch (error) {
    console.error('❌ Google Sheets initialization error:', error);
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