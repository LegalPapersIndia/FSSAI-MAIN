require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const leadRoutes = require('./routes/leadRoutes');
const adminAuth = require('./middleware/adminAuth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Setup
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Routes
app.use('/', leadRoutes);

// Admin Route (Protected)
app.get('/admin', adminAuth, (req, res) => {
  res.render('admin');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});