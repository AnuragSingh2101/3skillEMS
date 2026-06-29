const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000 
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('----------------------------------------------------');
    console.log('WARNING: MongoDB is not running or could not connect.');
    console.log('----------------------------------------------------');
    process.env.USE_MOCK_DB = 'true';
  }
};

module.exports = connectDB;
