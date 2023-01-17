import { MongoClient } from 'mongodb';
async function connectToDb() {
    let mongoClient;
    try {
        mongoClient = new MongoClient(process.env.DATABASE_URI);
        console.log('Connecting to MongoDB Atlas cluster...');
        await mongoClient.connect();
        console.log('Successfully connected to MongoDB Atlas!');
        return mongoClient;

    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
}

export async function createDb() {
    let mongoClient;

    mongoClient = await connectToDb();
    const db = mongoClient.db('managementApp');
    return db;
}