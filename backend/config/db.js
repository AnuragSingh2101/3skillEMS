const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-management', {
      serverSelectionTimeoutMS: 3000 // Timeout after 3 seconds instead of 30s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('----------------------------------------------------');
    console.log('WARNING: MongoDB is not running or could not connect.');
    console.log('The system will fall back to an IN-MEMORY DATA STORE.');
    console.log('Note: Data will be lost when the server restarts.');
    console.log('To persist data, please start MongoDB locally or configure MONGO_URI in backend/.env');
    console.log('----------------------------------------------------');
    process.env.USE_MOCK_DB = 'true';
  }
};

module.exports = connectDB;
