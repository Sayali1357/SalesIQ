const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salesiq';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Local MongoDB not detected (${error.message}). Starting MongoMemoryServer...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: { port: 27017, dbName: 'salesiq' }
      });
      const memoryUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`In-Memory MongoDB Connected at: ${conn.connection.host}`);
    } catch (memErr) {
      console.error('Failed to launch In-Memory MongoDB:', memErr.message);
    }
  }

  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database empty. Running initial seed...');
      const seedDB = require('../scripts/seedData');
      await seedDB({ disconnect: false });
    }
  } catch (seedErr) {
    console.error('Auto-seed error:', seedErr.message);
  }
};

module.exports = connectDB;
