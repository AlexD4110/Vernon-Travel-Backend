const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const enforce = require('express-sslify');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Use JSON parser middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
   origin: process.env.NODE_ENV === 'production' ? 'https://vernontravellbasketball.org' : 'http://localhost:5173', // Production or localhost
   credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};
app.use(cors(corsOptions));

// Security: Helmet to set various HTTP headers for protection
app.use(helmet());

// Enforce HTTPS only in production
if (process.env.NODE_ENV === 'production') {
   app.use(enforce.HTTPS({ trustProtoHeader: true }));
   console.log('Enforcing HTTPS');
} else {
   console.log('Running in development mode');
}

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100, // Limit each IP to 100 requests per windowMs
   message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
})
   .then(() => console.log('MongoDB connected'))
   .catch(err => console.log('MongoDB connection error:', err.message)); // Add better error logging

// Import Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Start the Server
const PORT = process.env.PORT || 5134;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
   console.log('SIGTERM received: closing HTTP server');
   server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
         console.log('MongoDB connection closed');
         process.exit(0);
      });
   });
});
