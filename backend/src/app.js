const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// CORS configuration: Allow localhost, Vercel subdomains, and the custom FRONTEND_URL env
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  // Support comma-separated URLs in case there are multiple frontends
  const urls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  urls.forEach(url => {
    if (url) {
      if (allowedOrigins.indexOf(url) === -1) {
        allowedOrigins.push(url);
      }
      // Remove trailing slash if user included one, to make matching bulletproof
      const cleanUrl = url.replace(/\/$/, '');
      if (allowedOrigins.indexOf(cleanUrl) === -1) {
        allowedOrigins.push(cleanUrl);
      }
    }
  });
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                      origin.endsWith('.vercel.app');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', bookingRoutes); // Includes POST /api/reserve and POST /api/bookings

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SortMyScene Event Ticket Booking API' });
});

// Custom Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
