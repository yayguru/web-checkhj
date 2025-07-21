// server.js - Simple Node.js proxy for Codex API
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*'
}));

// Proxy middleware configuration
const proxyOptions = {
  target: 'http://89.19.222.90:8090',
  changeOrigin: true,
  pathRewrite: {
    '^/codex': '', // Remove /codex prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log the proxied request
    console.log(`Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'Proxy error',
      message: err.message
    });
  }
};

// Apply proxy to /codex routes
app.use('/codex', createProxyMiddleware(proxyOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    target: 'http://89.19.222.90:8090',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Codex API Proxy Server',
    endpoints: {
      health: '/health',
      proxy: '/codex/*'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Codex proxy server running on port ${PORT}`);
  console.log(`Proxying requests to: http://89.19.222.90:8090`);
});