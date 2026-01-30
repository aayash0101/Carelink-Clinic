db.js









// config/db.js - ENHANCED
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'mongodb://localhost:27017/carelink';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`✅ Connected to MongoDB at ${uri.replace(/(mongodb:\/\/.*:)(.*)(@.*)/, '$1****$3')}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
