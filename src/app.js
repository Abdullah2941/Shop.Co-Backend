const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/error');
const connectDB = require('./config/db');

const app = express();

// Allowed frontends from CLIENT_URLS. Spaces, trailing "/" and upper/lower case are ignored.
const clean = (u) => u.trim().replace(/\/+$/, '').toLowerCase();
const defaults = [
  'https://shop-co-e-commerce-website-rose.vercel.app',
  'https://shop-co-admin-panel.vercel.app',
  'https://react-assignment-1-drab-six.vercel.app',
  'https://admin-panel-two-lyart.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];
const allowed = [...new Set([...(process.env.CLIENT_URLS || '').split(',').map(clean).filter(Boolean), ...defaults])];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes('*') || allowed.includes(clean(origin))) return cb(null, true);
      console.error(`CORS blocked: ${origin} (allowed: ${allowed.join(', ') || 'none'})`);
      cb(null, false); // no CORS headers -> the browser blocks it, server does not crash
    },
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ message: 'SHOP.CO API running' }));

// Make sure the database is connected before any /api route runs
// (works whichever way the host starts the app: server.js, api/index.js, ...)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(500).json({ success: false, message: `Database connection failed: ${err.message}` });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
