const { MongoClient, ServerApiVersion } = require('mongodb');

const username = 'btsttacademy_db_user';
const password = 'BTsttacademy';
const cluster = 'cluster0.boy9chp';
const dbName = 'testdb';

const uri = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cluster}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
});

let db;

async function initializeMongoDB() {
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        await client.connect();
        
        await client.db(dbName).command({ ping: 1 });
        console.log('✅ MongoDB Atlas: Connected successfully!');
        
        db = client.db(dbName);
        
        // Ensure collections exist
        await db.createCollection('inquiries');
        await db.createCollection('web_content');
        await db.createCollection('reviews');
        await db.createCollection('gallery');
        await db.createCollection('awards'); // Add awards collection
        console.log('✅ MongoDB collections ready');
        
        return db;
        
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        throw error;
    }
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeMongoDB first.');
    }
    return db;
}

module.exports = {
    initializeMongoDB,
    getDatabase,
    client
};