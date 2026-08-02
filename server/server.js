const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase, connectDatabase } = require('./db');
const authModule = require('./routes/auth');
const apiRouter = require('./routes/api');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend API requests
app.use(cors({
  origin: '*', // In production, replace with specific frontend domains
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (Simple logger)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Serverless DB Connection & Seeding Middleware
app.use(async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Gagal terhubung ke Database.' });
  }
});


// Register routes
app.use('/api/auth', authModule.router);
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistem presensi MA PIQ Singosari backend berjalan dengan baik.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Terjadi kesalahan sistem internal pada server.' });
});

// Boot Server (Only in local development, Vercel uses module.exports)
async function startServer() {
  try {
    console.log('Menghubungkan ke database...');
    await initDatabase(); // Init Database seeds initial data if empty
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` SERVER BACKEND MA PIQ TAKHOSUS TELAH BERJALAN `);
      console.log(` Port   : ${PORT}                               `);
      console.log(` URL    : http://localhost:${PORT}             `);
      console.log(` Status : AKTIF & SEEDING SELESAI                `);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'production') {
  startServer();
}

// Export for Vercel Serverless
module.exports = app;
