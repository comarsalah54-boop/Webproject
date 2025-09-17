const { spawn } = require('child_process');
const { RestartLog } = require('../models');
const logger = require('../utils/logger');

const executeRestart = async (servers, restartLog, io) => {
  try {
    const details = { servers: [], errors: [] };
    
    // Sort servers by restart order
    servers.sort((a, b) => a.restartOrder - b.restartOrder);
    
    if (io) {
      io.emit('restart-status', {
        logId: restartLog.id,
        status: 'started',
        message: 'Restart process initiated'
      });
    }
    
    for (const server of servers) {
      try {
        logger.info(`Restarting server: ${server.name} (${server.hostname})`);
        
        // First, test connectivity
        const pingResult = await pingServer(server.ipAddress);
        if (!pingResult) {
          throw new Error(`Server ${server.ipAddress} is not reachable via ping`);
        }
        
        // Execute SSH reboot command
        await executeSSHReboot(server);
        
        details.servers.push({
          id: server.id,
          name: server.name,
          hostname: server.hostname,
          status: 'success',
          timestamp: new Date()
        });
        
        if (io) {
          io.emit('restart-status', {
            logId: restartLog.id,
            serverId: server.id,
            status: 'restarted',
            message: `Server ${server.name} restart command sent successfully`
          });
        }
        
        // Wait for restart delay if specified
        if (server.restartDelay > 0) {
          logger.info(`Waiting ${server.restartDelay} seconds before next server...`);
          await new Promise(resolve => setTimeout(resolve, server.restartDelay * 1000));
        }
        
      } catch (error) {
        logger.error(`Failed to restart ${server.name}:`, error);
        details.errors.push({
          serverId: server.id,
          serverName: server.name,
          error: error.message
        });
        
        if (io) {
          io.emit('restart-status', {
            logId: restartLog.id,
            serverId: server.id,
            status: 'error',
            message: `Failed to restart ${server.name}: ${error.message}`
          });
        }
      }
    }
    
    // Update restart log
    const status = details.errors.length === 0 ? 'completed' : 'failed';
    await restartLog.update({
      status,
      details,
      endTime: new Date()
    });
    
    if (io) {
      io.emit('restart-status', {
        logId: restartLog.id,
        status: status,
        message: `Restart process ${status}. ${details.servers.length} successful, ${details.errors.length} failed.`,
        details
      });
    }
    
  } catch (error) {
    logger.error('Restart process failed:', error);
    await restartLog.update({
      status: 'failed',
      details: { error: error.message },
      endTime: new Date()
    });
    
    if (io) {
      io.emit('restart-status', {
        logId: restartLog.id,
        status: 'failed',
        message: `Restart process failed: ${error.message}`
      });
    }
  }
};

const pingServer = (host) => {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const pingCmd = isWindows ? 'ping' : 'ping';
    const pingArgs = isWindows ? ['-n', '1', '-w', '3000', host] : ['-c', '1', '-W', '3', host];
    
    const ping = spawn(pingCmd, pingArgs);
    
    ping.on('close', (code) => {
      resolve(code === 0);
    });
    
    ping.on('error', (error) => {
      logger.error(`Ping error for ${host}:`, error);
      resolve(false);
    });
    
    setTimeout(() => {
      ping.kill();
      resolve(false);
    }, 5000);
  });
};

const executeSSHReboot = (server) => {
  return new Promise((resolve, reject) => {
    const sshUser = server.sshUser || 'root';
    const sshPort = server.sshPort || 22;
    
    logger.info(`Executing SSH reboot on ${sshUser}@${server.hostname}:${sshPort}`);
    
    const ssh = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=10',
      '-o', 'ServerAliveInterval=5',
      '-o', 'ServerAliveCountMax=3',
      '-p', sshPort.toString(),
      `${sshUser}@${server.hostname}`,
      'sudo reboot || reboot'
    ]);
    
    let stdout = '';
    let stderr = '';
    
    ssh.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    ssh.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ssh.on('close', (code) => {
      // For reboot command, connection will be closed abruptly
      // Code 255 or null is expected when server reboots
      if (code === 0 || code === null || code === 255) {
        logger.info(`SSH reboot command sent successfully to ${server.hostname}`);
        resolve(true);
      } else {
        const errorMsg = stderr || `SSH command failed with exit code ${code}`;
        logger.error(`SSH reboot failed for ${server.hostname}: ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    });
    
    ssh.on('error', (error) => {
      logger.error(`SSH spawn error for ${server.hostname}:`, error);
      reject(new Error(`SSH connection failed: ${error.message}`));
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
      ssh.kill();
      reject(new Error('SSH command timeout'));
    }, 15000);
  });
};

module.exports = { executeRestart };