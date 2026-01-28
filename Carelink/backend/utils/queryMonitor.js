// utils/queryMonitor.js - NEW FILE
const { logSecurityEvent } = require('./logger');

const queryStats = new Map();

exports.monitorQuery = (model, operation, query) => {
  const key = `${model}:${operation}`;
  const now = Date.now();
  
  if (!queryStats.has(key)) {
    queryStats.set(key, []);
  }
  
  const stats = queryStats.get(key);
  stats.push({ timestamp: now, query });
  
  // Keep only last 1000 queries
  if (stats.length > 1000) {
    stats.shift();
  }
  
  // ✅ Detect suspicious patterns
  const recentQueries = stats.filter(s => now - s.timestamp < 60000); // Last minute
  
  if (recentQueries.length > 100) {
    logSecurityEvent('ABNORMAL_QUERY_RATE', {
      model,
      operation,
      count: recentQueries.length,
      severity: 'HIGH'
    });
  }
  
  // ✅ Detect NoSQL injection attempts
  const queryString = JSON.stringify(query);
  if (queryString.includes('$where') || queryString.includes('$regex')) {
    logSecurityEvent('POTENTIAL_NOSQL_INJECTION', {
      model,
      operation,
      query: queryString.substring(0, 200),
      severity: 'CRITICAL'
    });
  }
};

// // Usage in Mongoose middleware
// // models/User.js
// userSchema.pre('find', function() {
//   require('../utils/queryMonitor').monitorQuery('User', 'find', this.getQuery());
// });