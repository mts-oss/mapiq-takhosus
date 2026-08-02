const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Teacher } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_mapiq_key_123';

// 1. JWT Authentication Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Expects 'Bearer <token>'

  if (!token) {
    return res.status(403).json({ message: 'Token otorisasi diperlukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
    }
    req.user = decoded;
    next();
  });
}

// 2. Admin verification helper
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Fitur ini hanya untuk Admin.' });
  }
}

// 3. Login Endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  try {
    const cleanUsername = username.toLowerCase().trim();
    
    // 1. Find user in MongoDB
    let user = await User.findOne({ username: cleanUsername });

    // 2. If user not found, check if username matches a Teacher ID (e.g. G001, G002, etc.)
    if (!user) {
      const teacher = await Teacher.findOne({ _id: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } });
      if (teacher) {
        const defaultPasswordHash = await bcrypt.hash('guru123', 10);
        user = await User.create({
          username: teacher._id.toLowerCase(),
          passwordHash: defaultPasswordHash,
          role: 'guru',
          teacherId: teacher._id
        });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    // Find teacher details if applicable
    let displayName = 'Administrator';
    if (user.role === 'guru' && user.teacherId) {
      const teacher = await Teacher.findById(user.teacherId);
      displayName = teacher ? teacher.name : user.username;
    }

    // Sign JWT Token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role, 
        teacherId: user.teacherId,
        name: displayName
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        name: displayName,
        teacherId: user.teacherId
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan sistem pada server.' });
  }
});

module.exports = {
  router,
  verifyToken,
  requireAdmin
};
