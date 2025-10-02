// setup-drive-oauth.js
const { getAuthUrl, getTokens } = require('./utils/driveUpload');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupDriveOAuth() {
    console.log('🚀 Setting up Google Drive OAuth (for uploads only)...\n');
    
    const authUrl = getAuthUrl();
    console.log('1. Visit this URL in your browser:');
    console.log('\x1b[36m%s\x1b[0m', authUrl);
    console.log('\n2. Click "Continue" and allow Drive permissions');
    console.log('3. Copy the authorization code and paste below:\n');
    
    rl.question('📝 Enter authorization code: ', async (code) => {
        try {
            await getTokens(code.trim());
            console.log('\n✅ Drive OAuth setup completed!');
            console.log('🔐 Tokens saved to drive-tokens.json');
            console.log('\n🎉 You can now upload files to Drive!');
        } catch (error) {
            console.log('\n❌ Setup failed:', error.message);
        } finally {
            rl.close();
        }
    });
}

// Check if OAuth credentials exist
try {
    require('./oauth-credentials.json');
    setupDriveOAuth();
} catch (error) {
    console.log('❌ oauth-credentials.json not found!');
    console.log('💡 Please save your OAuth JSON file as oauth-credentials.json');
}