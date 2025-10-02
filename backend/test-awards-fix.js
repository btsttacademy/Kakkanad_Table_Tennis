const { google } = require('googleapis');

async function testAwardsFix() {
  try {
    console.log('🔧 Testing Awards Sheet Fix...\n');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    const SPREADSHEET_ID = '16JavJ8ehyDoa8Ij0YXuz9JhrtwabThXT28u0ZNAhpwM';
    
    // Check current state of Awards sheet
    console.log('1. Checking Awards sheet...');
    try {
      const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Awards!A:Z',
      });
      
      const rows = data.data.values;
      console.log('   Current data:', rows);
      
      if (!rows || rows.length === 0) {
        console.log('   ⚠️ Awards sheet is completely empty');
      } else {
        console.log(`   📊 Found ${rows.length} rows in Awards sheet`);
        console.log('   📑 Headers:', rows[0]);
      }
    } catch (error) {
      console.log('   ❌ Error reading Awards sheet:', error.message);
    }

    console.log('\n2. Adding sample data to Awards sheet...');
    
    // Add sample data
    const headers = ['Image No', 'Thumbnail URL', 'Preview URL', 'Description'];
    const sampleData = [
      [1, 'https://drive.google.com/thumbnail?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi&sz=w400', 'https://drive.google.com/uc?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi', 'First Place Award'],
      [2, 'https://drive.google.com/thumbnail?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi&sz=w400', 'https://drive.google.com/uc?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi', 'Best Institute 2024'],
      [3, 'https://drive.google.com/thumbnail?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi&sz=w400', 'https://drive.google.com/uc?id=1KbuS67AH4arRef04z7X_lBvHNzWMUxdi', 'Excellence Award']
    ];

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Awards!A1:D1',
        valueInputOption: 'RAW',
        resource: { values: [headers] }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Awards!A2:D4',
        valueInputOption: 'RAW',
        resource: { values: sampleData }
      });

      console.log('   ✅ Sample data added successfully!');
      
      // Verify the data was added
      const verifyData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Awards!A:D',
      });
      
      console.log('   📋 Verified data:', verifyData.data.values);
      
    } catch (error) {
      console.log('   ❌ Error adding sample data:', error.message);
    }

    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAwardsFix();