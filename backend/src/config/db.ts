import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB(): Promise<void> {
    const mongoUri = process.env.MONGO_URI;
    if(!mongoUri) {
        throw new Error("MONGO_URI is not defined");
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('[MongoDB] Connected to Replica Set rs0 successfully');
    }catch (error) {
        console.error('[MongoDB] Connection failed:', error);
        process.exit(1);
    }
}