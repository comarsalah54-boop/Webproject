const { spawn } = require('child_process');
const { Server, MonitorLog } = require('../models');
const logger = require('../utils/logger');
const { sendAlertEmail } = require('./emailService');

let monitoringInterval;

const startMonitoring = (io) => {
  logger.info('Starting server monitoring service');
  
  // Monitor every minute
  monitoringInterval = setInterval(async () => {
    await monitorAllServers(io);
  }, 60000);
  
  // Initial monitoring
  monitorAllServers(io);
};

const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    logger.info('Monitoring service stopped');
  }
};

const monitorAllServers = async (io) => {
  try {
    const servers = await Server.findAll({ where: { isActive: true } });
    
    for (const server of servers) {
      const startTime = Date.now();
      
      const pingResult = await pingServer(server.ipAddress);
      const telnetResult = await telnetServer(server.ipAddress, server.port);
      const responseTime = Date.now() - startTime;
      
      // Determine overall status
      const isOnline = pingResult && telnetResult;
      const previousStatus = server.status;
      const newStatus = isOnline ? 'online' : 'offline';
      
      // Update server status
      await server.update({
        status: newStatus,
        lastPing: pingResult ? new Date() : server.lastPing,
        lastTelnet: telnetResult ? new Date() : server.lastTelnet
      });
      
      // Log monitoring result
      await MonitorLog.create({
        serverId: server.id,
        pingStatus: pingResult,
        telnetStatus: telnetResult,
        responseTime,
        errorMessage: !isOnline ? `Ping: ${pingResult ? 'OK' : 'FAIL'}, Telnet: ${telnetResult ? 'OK' : 'FAIL'}` : null
      });
      
      // Send alert if server went offline
      if (previousStatus === 'online' && newStatus === 'offline') {
        await sendAlertEmail(server, 'Server is offline');
      }
      
      // Emit real-time update
      if (io) {
        io.emit('server-status', {
          serverId: server.id,
          status: newStatus,
          pingStatus: pingResult,
          telnetStatus: telnetResult,
          responseTime,
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    logger.error('Monitoring error:', error);
  }
};

const pingServer = (host) => {
  return new Promise((resolve) => {
    // Use different ping command based on OS
    const isWindows = process.platform === 'win32';
    const pingCmd = isWindows ? 'ping' : 'ping';
    const pingArgs = isWindows ? ['-n', '1', '-w', '5000', host] : ['-c', '1', '-W', '5', host];
    
    const ping = spawn(pingCmd, pingArgs);
    
    let output = '';
    ping.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ping.stderr.on('data', (data) => {
      logger.error(`Ping stderr for ${host}:`, data.toString());
    });
    
    ping.on('close', (code) => {
      const success = code === 0;
      if (!success) {
        logger.warn(`Ping failed for ${host}, exit code: ${code}`);
      }
      resolve(success);
    });
    
    ping.on('error', (error) => {
      logger.error(`Ping error for ${host}:`, error);
      resolve(false);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      ping.kill();
      resolve(false);
    }, 10000);
  });
};

const telnetServer = (host, port) => {
  return new Promise((resolve) => {
    // Try to create a TCP connection using Node.js net module instead of nc
    const net = require('net');
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 5000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      clearTimeout(timeout);
      logger.warn(`Telnet failed for ${host}:${port}:`, error.message);
      resolve(false);
    });
  });
};

module.exports = { startMonitoring, stopMonitoring, monitorAllServers };