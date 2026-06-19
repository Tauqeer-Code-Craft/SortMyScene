require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { releaseExpiredReservations } = require('./src/utils/reservationHelper');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Background reservation holds cleaner (Only run if NOT on Vercel serverless)
if (!process.env.VERCEL) {
  const CLEANUP_INTERVAL = 30 * 1000;
  setInterval(async () => {
    try {
      await releaseExpiredReservations();
    } catch (error) {
      console.error('Background reservation cleanup failed:', error);
    }
  }, CLEANUP_INTERVAL);
}

// Start HTTP port listener (Only if NOT running on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export app for Vercel Serverless Functions deployment
module.exports = app;
