import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      dbName: 'taskchat'
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📍 Host: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
