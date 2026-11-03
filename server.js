// Local / Render / Railway: `npm start`
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const isAlreadyRunning = () => new Promise((resolve) => {
  const req = http.get({ hostname: '127.0.0.1', port: PORT, path: '/', timeout: 750 }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      try {
        resolve(res.statusCode === 200 && JSON.parse(body).message === 'SHOP.CO API running');
      } catch {
        resolve(false);
      }
    });
  });
  req.on('timeout', () => req.destroy());
  req.on('error', () => resolve(false));
});

const start = async () => {
  if (await isAlreadyRunning()) {
    console.log(`SHOP.CO backend is already running on port ${PORT}`);
    return;
  }

  await connectDB();
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use. The backend is likely already running.`);
      process.exit(0);
    }
    console.error('Server startup failed:', err.message);
    process.exit(1);
  });
};

start().catch((err) => {
  console.error(err.message?.includes('MongoDB') ? err.message : `Server startup failed: ${err.message}`);
  process.exit(1);
});
