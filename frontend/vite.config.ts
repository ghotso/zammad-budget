import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { ProxyOptions } from 'vite';

// Development: Backend on 3000, Frontend on 5173
// Production (Docker): Backend on 3071, Frontend on 8071
const isDev = process.env.NODE_ENV !== 'production';
const backendUrl = isDev ? 'http://localhost:3000' : 'http://localhost:3071';

const proxyOptions: ProxyOptions = {
  target: backendUrl,
  changeOrigin: true,
  secure: false,
  configure: (proxy, _options) => {
    proxy.on('error', (err, req, res) => {
      console.log('Proxy error:', err);
      console.log('Request:', req.method, req.url);
      if (res.statusCode) {
        console.log('Response status:', res.statusCode);
      }
    });
    proxy.on('proxyReq', (proxyReq, req) => {
      // Add CORS headers
      proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
      console.log('Sending Request:', req.method, req.url);
      console.log('Request Headers:', req.headers);
    });
    proxy.on('proxyRes', (proxyRes, req) => {
      console.log('Received Response:', proxyRes.statusCode, req.url);
      console.log('Response Headers:', proxyRes.headers);
    });
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': proxyOptions
    }
  },
  preview: {
    port: 8071,
    host: true,
  }
});