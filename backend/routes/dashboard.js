const express = require('express');
const { Server, MonitorLog, RestartLog, ScheduledTask, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalServers = await Server.count({ where: { isActive: true } });
    const onlineServers = await Server.count({ 
      where: { isActive: true, status: 'online' } 
    });
    const offlineServers = await Server.count({ 
      where: { isActive: true, status: 'offline' } 
    });
    const pendingTasks = await ScheduledTask.count({ 
      where: { status: 'pending' } 
    });
    
    // Get recent actions count (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActions = await RestartLog.count({
      where: {
        createdAt: {
          [Op.gte]: yesterday
        }
      }
    });
    
    // Get average response time from recent monitor logs
    const recentMonitorLogs = await MonitorLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: yesterday
        },
        responseTime: {
          [Op.not]: null
        }
      },
      attributes: ['responseTime']
    });
    
    const averageResponseTime = recentMonitorLogs.length > 0
      ? Math.round(recentMonitorLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentMonitorLogs.length)
      : 0;
    
    res.json({
      totalServers,
      onlineServers,
      offlineServers,
      pendingTasks,
      recentActions,
      averageResponseTime
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const recentLogs = await RestartLog.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: User, 
          attributes: ['username'] 
        }
      ]
    });
    
    const activity = recentLogs.map(log => ({
      id: log.id.toString(),
      action: log.isScheduled ? 'Scheduled Restart' : 'Manual Restart',
      serverName: `${log.serverIds.length} server(s)`,
      timestamp: log.createdAt,
      status: log.status === 'completed' ? 'success' : 
               log.status === 'failed' ? 'failed' : 'pending',
      user: log.User?.username || 'System'
    }));
    
    res.json(activity);
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;