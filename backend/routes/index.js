const express = require('express');
const authRoutes = require('./auth');
const serverRoutes = require('./servers');
const monitoringRoutes = require('./monitoring');
const restartRoutes = require('./restart');
const logsRoutes = require('./logs');
const schedulerRoutes = require('./scheduler');
const userRoutes = require('./users');
const groupRoutes = require('./groups');
const dashboardRoutes = require('./dashboard');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/servers', serverRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/restart', restartRoutes);
router.use('/logs', logsRoutes);
router.use('/scheduler', schedulerRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;