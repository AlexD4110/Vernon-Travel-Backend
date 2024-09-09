const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
require('./db-connection.js');

// Initialize Express app
const app = express();

app.use(express.json());


// CORS configuration
const corsOptions = {
   origin: 'http://localhost:5173', // Replace with your client's origin
   credentials: true,               // Allow credentials (cookies, authorization headers, etc.)
};


app.use(cors(corsOptions));


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
   .then(() => console.log('MongoDB connected'))
   .catch(err => console.log('MongoDB connection error:', err));


// Import Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);


// Start the Server
const PORT = process.env.PORT || 5134;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
