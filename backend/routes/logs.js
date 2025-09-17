const express = require('express');
const { RestartLog, MonitorLog, User, Server } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get restart logs
router.get('/restart', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await RestartLog.findAndCountAll({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: User, 
        attributes: ['username'] 
      }]
    });
    
    res.json({
      logs: logs.rows,
      total: logs.count,
      pages: Math.ceil(logs.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get monitor logs
router.get('/monitor', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, serverId } = req.query;
    
    const whereClause = serverId ? { serverId } : {};
    
    const logs = await MonitorLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: Server, 
        attributes: ['name', 'hostname'] 
      }]
    });
    
    res.json({
      logs: logs.rows,
      total: logs.count,
      pages: Math.ceil(logs.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Download restart log details
router.get('/restart/:id/download', authenticateToken, async (req, res) => {
  try {
    const log = await RestartLog.findByPk(req.params.id, {
      include: [{ 
        model: User, 
        attributes: ['username'] 
      }]
    });
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    // Get server details
    const { Server } = require('../models');
    const servers = await Server.findAll({
      where: { id: log.serverIds }
    });
    
    const logData = {
      id: log.id,
      user: log.User?.username || 'System',
      startTime: log.startTime,
      endTime: log.endTime,
      status: log.status,
      isScheduled: log.isScheduled,
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        hostname: s.hostname,
        ipAddress: s.ipAddress,
        port: s.port
      })),
      details: log.details,
      duration: log.endTime ? 
        Math.round((new Date(log.endTime) - new Date(log.startTime)) / 1000) : null
    };
    
    const filename = `assurnet-restart-log-${log.id}-${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(logData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Download monitor logs
router.get('/monitor/download', authenticateToken, async (req, res) => {
  try {
    const { serverId, days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const whereClause = {
      createdAt: {
        [require('sequelize').Op.gte]: startDate
      }
    };
    
    if (serverId) {
      whereClause.serverId = serverId;
    }
    
    const logs = await MonitorLog.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: Server, 
        attributes: ['name', 'hostname', 'ipAddress', 'port'] 
      }]
    });
    
    const filename = `assurnet-monitor-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      exportDate: new Date(),
      period: `${days} days`,
      totalRecords: logs.length,
      logs: logs
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;