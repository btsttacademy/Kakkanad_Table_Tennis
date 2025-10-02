const { google } = require('googleapis');

// Google Sheets configuration for awards
const AWARDS_SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
const AWARDS_SHEET_NAME = "Awards";

let sheets;

// Initialize Google Sheets for awards
async function initializeAwardsSheets() {
  try {
    let auth;
    
    // Check if we're in production and have environment variables
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('🔧 Using environment variables for Awards Google Sheets authentication');
      
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
      console.log('🔧 Using credentials.json file for Awards Google Sheets authentication');
      auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const client = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Awards Google Sheets API initialized');
    
    // Initialize the awards sheet with sample data if empty
    await initializeAwardsSheetWithData();
    
    return sheets;
  } catch (error) {
    console.error('❌ Awards Sheets initialization error:', error.message);
    
    // Check if it's a credentials file error
    if (error.code === 'ENOENT') {
      console.log('📝 Note: credentials.json not found. Using environment variables or running without Google Sheets.');
    }
    
    throw error;
  }
}

// Initialize awards sheet with headers and sample data
async function initializeAwardsSheetWithData() {
  try {
    console.log('🔄 Initializing awards sheet...');
    
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeAwardsSheets();
    }
    
    // Get all sheets to check if Awards sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: AWARDS_SPREADSHEET_ID,
    });
    
    const awardsSheetExists = spreadsheet.data.sheets.some(
      sheet => sheet.properties.title === AWARDS_SHEET_NAME
    );

    if (!awardsSheetExists) {
      console.log('📝 Creating Awards sheet...');
      // Create the Awards sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: AWARDS_SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: AWARDS_SHEET_NAME,
                },
              },
            },
          ],
        },
      });
    }

    // Check if sheet has data
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: AWARDS_SPREADSHEET_ID,
      range: `${AWARDS_SHEET_NAME}!A:Z`,
    });

    const rows = existingData.data.values;

    // If sheet is empty or only has headers, add sample data
    if (!rows || rows.length <= 1) {
      console.log('📝 Adding sample data to Awards sheet...');
      
      // Headers
      const headers = ['Image No', 'Thumbnail URL', 'Preview URL', 'Description'];
      
      // Sample data with proper Google Drive URLs
      const sampleData = [
        [
          1,
          'https://drive.google.com/thumbnail?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi&sz=w400',
          'https://drive.google.com/uc?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi',
          'First Place Award - Excellence in Training'
        ],
        [
          2,
          'https://drive.google.com/thumbnail?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi&sz=w400',
          'https://drive.google.com/uc?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi',
          'Best Coaching Institute 2024'
        ],
        [
          3,
          'https://drive.google.com/thumbnail?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi&sz=w400',
          'https://drive.google.com/uc?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi',
          'Outstanding Student Results Achievement'
        ]
      ];

      // Set headers and data
      await sheets.spreadsheets.values.update({
        spreadsheetId: AWARDS_SPREADSHEET_ID,
        range: `${AWARDS_SHEET_NAME}!A1:D1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: AWARDS_SPREADSHEET_ID,
        range: `${AWARDS_SHEET_NAME}!A2:D4`,
        valueInputOption: 'RAW',
        resource: {
          values: sampleData
        }
      });

      console.log('✅ Sample awards data added successfully!');
    } else {
      console.log('✅ Awards sheet already has data');
    }

  } catch (error) {
    console.error('❌ Error initializing awards sheet:', error.message);
    throw error;
  }
}

// Get awards data from Google Sheets
async function getAwardsDataFromSheets() {
  try {
    console.log('🔄 Fetching awards data from Google Sheets...');
    
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeAwardsSheets();
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: AWARDS_SPREADSHEET_ID,
      range: `${AWARDS_SHEET_NAME}!A:D`,
    });

    const rows = response.data.values;
    
    console.log('📄 Raw data from Awards sheet:', rows ? `Found ${rows.length} rows` : 'No data');
    
    if (!rows || rows.length < 2) {
      console.log('⚠️ No awards data found in sheet');
      return {
        success: true,
        data: [],
        totalAwards: 0,
        source: 'google_sheets',
        message: 'No awards data found'
      };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    console.log('📑 Headers:', headers);
    console.log('📝 Data rows count:', dataRows.length);

    const awards = dataRows.map((row, index) => {
      // Skip empty rows
      if (!row || row.length === 0) {
        console.log(`⏭️ Skipping empty row ${index + 2}`);
        return null;
      }

      const imageNo = parseInt(row[0]) || index + 1;
      const thumbnailUrl = row[1] ? row[1].toString().trim() : '';
      const previewUrl = row[2] ? row[2].toString().trim() : '';
      const description = row[3] ? row[3].toString().trim() : '';

      if (!thumbnailUrl && !previewUrl) {
        console.log(`⏭️ Skipping row ${index + 2}: No URLs found`);
        return null;
      }

      // Extract file ID from URLs
      let fileId = "";
      if (previewUrl.includes('id=')) {
        fileId = previewUrl.split('id=')[1]?.split('&')[0];
      } else if (thumbnailUrl.includes('id=')) {
        fileId = thumbnailUrl.split('id=')[1]?.split('&')[0];
      } else if (previewUrl.includes('/file/d/')) {
        fileId = previewUrl.split('/file/d/')[1]?.split('/')[0];
      } else if (thumbnailUrl.includes('/file/d/')) {
        fileId = thumbnailUrl.split('/file/d/')[1]?.split('/')[0];
      }

      const award = {
        imageNo: imageNo,
        thumbnailUrl: thumbnailUrl || previewUrl, // Use preview as fallback
        previewUrl: previewUrl || thumbnailUrl,   // Use thumbnail as fallback
        description: description,
        fileId: fileId
      };
      
      console.log(`✅ Processed award ${index + 1}:`, {
        imageNo: award.imageNo,
        description: award.description
      });
      return award;
    }).filter(item => item !== null);

    console.log(`✅ Retrieved ${awards.length} awards from Google Sheets`);
    
    return {
      success: true,
      data: awards,
      totalAwards: awards.length,
      source: 'google_sheets',
      lastSync: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error getting awards from sheets:', error.message);
    throw error;
  }
}

// Main function to get awards data
async function getAwardsData() {
  try {
    const result = await getAwardsDataFromSheets();
    return result;
  } catch (error) {
    console.error('❌ Error getting awards data:', error.message);
    
    return {
      success: false,
      data: [],
      totalAwards: 0,
      source: 'error',
      message: 'Failed to load awards data: ' + error.message
    };
  }
}

// Test awards connection
async function testAwardsConnection() {
  try {
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeAwardsSheets();
    }

    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId: AWARDS_SPREADSHEET_ID,
    });
    
    const availableSheets = sheetsResponse.data.sheets.map(sheet => sheet.properties.title);
    console.log('📋 Available sheets:', availableSheets);
    
    const awardsData = await getAwardsData();
    
    return {
      success: true,
      message: 'Awards service is connected',
      googleSheets: {
        connected: true,
        spreadsheetTitle: sheetsResponse.data.properties.title,
        availableSheets: availableSheets
      },
      awards: {
        totalAwards: awardsData.totalAwards,
        source: awardsData.source,
        success: awardsData.success
      }
    };
    
  } catch (error) {
    console.error('❌ Awards connection test failed:', error.message);
    return {
      success: false,
      message: 'Awards service connection failed: ' + error.message
    };
  }
}

// Add award to sheet (admin function)
async function addAward(awardData) {
  try {
    console.log('📝 Adding award to sheet...');
    
    // Make sure sheets is initialized
    if (!sheets) {
      await initializeAwardsSheets();
    }

    const rowData = [
      awardData.imageNo || '',
      awardData.thumbnailUrl || '',
      awardData.previewUrl || '',
      awardData.description || ''
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: AWARDS_SPREADSHEET_ID,
      range: `${AWARDS_SHEET_NAME}!A:D`,
      valueInputOption: 'RAW',
      resource: {
        values: [rowData]
      }
    });

    console.log('✅ Award added successfully');
    return {
      success: true,
      message: 'Award added successfully',
      data: response.data
    };
    
  } catch (error) {
    console.error('❌ Error adding award:', error.message);
    return {
      success: false,
      message: 'Failed to add award: ' + error.message
    };
  }
}

// Refresh awards data (force fresh fetch)
async function refreshAwards() {
  try {
    console.log('🔄 Force refreshing awards data...');
    
    const result = await getAwardsDataFromSheets();
    
    return {
      ...result,
      refreshed: true,
      message: 'Awards data refreshed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error refreshing awards:', error.message);
    return {
      success: false,
      message: 'Failed to refresh awards: ' + error.message
    };
  }
}

module.exports = {
  initializeAwardsSheets,
  getAwardsData,
  testAwardsConnection,
  addAward,
  refreshAwards
};