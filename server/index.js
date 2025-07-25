const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://mern-excel-analyzer.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/history', require('./routes/history'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

// Protected test route
app.get('/api/protected', auth, (req, res) => {
  res.json({ msg: 'Protected route accessed', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
