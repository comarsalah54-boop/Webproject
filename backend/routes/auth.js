const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Register (Admin only or first user)
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, permissions } = req.body;
    
    // Check if this is the first user (auto-admin)
    const userCount = await User.count();
    const isFirstUser = userCount === 0;
    
    // If not first user, check admin permission
    if (!isFirstUser) {
      // Extract token from request
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Admin access required' });
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
    
    const existingUser = await User.findOne({
      where: { 
        $or: [{ username }, { email }] 
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: isFirstUser ? 'admin' : (role || 'user'),
      permissions: isFirstUser ? {
        canMonitor: true,
        canRestart: true,
        canViewLogs: true,
        canManageServers: true,
        canManageUsers: true,
        canScheduleTasks: true
      } : (permissions || {
        canMonitor: true,
        canRestart: false,
        canViewLogs: true,
        canManageServers: false,
        canManageUsers: false,
        canScheduleTasks: false
      })
    });
    
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: user.id,
      isFirstUser 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('username').trim().escape(),
  body('password').exists(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    
    const user = await User.findOne({ where: { username, isActive: true } });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await user.update({ lastLogin: new Date() });
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email,
        role: user.role, 
        permissions: user.permissions 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;