// Minimal test server to verify routes work
const express = require('express');
const app = express();

console.log('[TEST] Starting minimal server...');

// Test routes first
app.get('/test', (req, res) => {
  console.log('[TEST] GET /test called');
  res.json({ success: true, message: 'Test route works' });
});

// Try to load products route and catch errors
try {
  console.log('[TEST] Loading products route...');
  const productsRoute = require('./routes/products');
  console.log('[TEST] Products route loaded successfully');
  app.use('/api/products', productsRoute);
  console.log('[TEST] Products route mounted');
} catch (err) {
  console.error('[TEST] ERROR loading products route:', err.message);
  console.error(err.stack);
}

// Try to load departments route and catch errors
try {
  console.log('[TEST] Loading departments route...');
  const deptRoute = require('./routes/departments');
  console.log('[TEST] Departments route loaded successfully');
  app.use('/api/departments', deptRoute);
  console.log('[TEST] Departments route mounted');
} catch (err) {
  console.error('[TEST] ERROR loading departments route:', err.message);
  console.error(err.stack);
}

// 404 handler
app.use((req, res) => {
  console.log('[TEST] 404 - No route matched for:', req.method, req.path);
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[TEST] ERROR in app:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// Start server
const PORT = 5001;
console.log('[TEST] About to call app.listen()...');
const server = app.listen(PORT, () => {
  console.log(`[TEST] ✅ Server running on port ${PORT}`);
  console.log(`[TEST] Try: curl http://localhost:${PORT}/api/products`);
  console.log(`[TEST] Try: curl http://localhost:${PORT}/api/departments`);
});

console.log('[TEST] app.listen() returned, server object created');

server.on('error', (err) => {
  console.error('[TEST] Server error:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[TEST] Uncaught exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[TEST] Unhandled rejection:', reason);
});

console.log('[TEST] All error handlers set up');
