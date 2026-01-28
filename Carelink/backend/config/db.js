db.js

// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luxaro', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`❌ MongoDB Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;







// config/db.js - ENHANCED
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');

const connectDB = async () => {
  try {
    // ✅ PRODUCTION: Require connection string to have auth
    const uri = process.env.MONGODB_URI;
    
    if (process.env.NODE_ENV === 'production') {
      // Validate production connection string
      if (!uri.includes('@')) {
        throw new Error('MongoDB connection must use authentication in production');
      }
      if (!uri.startsWith('mongodb+srv://') && !uri.includes('ssl=true')) {
        console.warn('⚠️  WARNING: MongoDB connection not using SSL/TLS');
      }
    }
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // ✅ SECURITY OPTIONS
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      
      // ✅ Production-only security
      ...(process.env.NODE_ENV === 'production' && {
        ssl: true,
        authSource: 'admin',
        retryWrites: true,
        w: 'majority'
      })
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // ✅ Log connection event
    logSecurityEvent('DATABASE_CONNECTED', {
      host: conn.connection.host,
      database: conn.connection.name,
      ssl: conn.connection.client.s.options.ssl || false
    });
    
    // ✅ Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
      logSecurityEvent('DATABASE_ERROR', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
      logSecurityEvent('DATABASE_DISCONNECTED', {});
    });
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    logSecurityEvent('DATABASE_CONNECTION_FAILED', {
      error: error.message,
      severity: 'CRITICAL'
    });
    process.exit(1);
  }
};

module.exports = connectDB;
