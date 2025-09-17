import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { dashboardAPI, monitoringAPI } from '../services/api';
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  pendingTasks: number;
  recentActions: number;
  averageResponseTime: number;
}

interface RecentActivity {
  id: string;
  action: string;
  serverName: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  user: string;
}

interface ServerStatus {
  id: number;
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline' | 'unknown';
  lastPing?: string;
  lastTelnet?: string;
  responseTime?: number;
  Group?: {
    name: string;
    color: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    onlineServers: 0,
    offlineServers: 0,
    pendingTasks: 0,
    recentActions: 0,
    averageResponseTime: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('server-status', (data) => {
        setServers(prev => prev.map(server => 
          server.id === data.serverId 
            ? { ...server, status: data.status, responseTime: data.responseTime }
            : server
        ));
      });

      return () => {
        socket.off('server-status');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, activityData, serversData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getActivity(),
        monitoringAPI.getStatus()
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
      setServers(serversData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getServerStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return AlertTriangle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Assurnet Orchestration - Real-time server monitoring overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Servers</p>
              <p className="text-2xl font-bold text-white">{stats.totalServers}</p>
            </div>
            <Server className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Online Servers</p>
              <p className="text-2xl font-bold text-green-500">{stats.onlineServers}</p>
              <p className="text-xs text-gray-500">
                {stats.totalServers > 0 ? Math.round((stats.onlineServers / stats.totalServers) * 100) : 0}% uptime
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Offline Servers</p>
              <p className="text-2xl font-bold text-red-500">{stats.offlineServers}</p>
              {stats.offlineServers > 0 && (
                <p className="text-xs text-red-500">Requires attention</p>
              )}
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingTasks}</p>
              <p className="text-xs text-gray-500">Scheduled tasks</p>
            </div>
            <Calendar className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            System Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Average Response Time</span>
              <span className="font-medium text-white">
                {stats.averageResponseTime > 0 ? `${stats.averageResponseTime}ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Recent Actions (24h)</span>
              <span className="font-medium text-white">{stats.recentActions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">System Status</span>
              <span className={`font-medium ${
                stats.offlineServers === 0 ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {stats.offlineServers === 0 ? 'All Systems Operational' : 'Some Issues Detected'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap className="mr-2" size={20} />
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/servers'}
              className="w-full text-left px-3 py-2 text-sm bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/30 transition-colors"
            >
              View All Servers
            </button>
            <button 
              onClick={() => window.location.href = '/scheduler'}
              className="w-full text-left px-3 py-2 text-sm bg-green-900/20 text-green-400 rounded-lg hover:bg-green-900/30 transition-colors"
            >
              Schedule Maintenance
            </button>
            <button 
              onClick={() => window.location.href = '/logs'}
              className="w-full text-left px-3 py-2 text-sm bg-yellow-900/20 text-yellow-400 rounded-lg hover:bg-yellow-900/30 transition-colors"
            >
              View System Logs
            </button>
            {stats.offlineServers > 0 && (
              <button 
                onClick={() => window.location.href = '/monitoring'}
                className="w-full text-left px-3 py-2 text-sm bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
              >
                Check Offline Servers
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Server Status Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Activity className="mr-2" size={20} />
            Server Status Overview
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.slice(0, 6).map((server) => {
              const StatusIcon = getServerStatusIcon(server.status);
              return (
                <div key={server.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium truncate">{server.name}</h3>
                    <StatusIcon size={16} className={getServerStatusColor(server.status)} />
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-400">
                    <p>Host: {server.hostname}</p>
                    <p>IP: {server.ipAddress}:{server.port}</p>
                    {server.Group && (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: server.Group.color }}
                        ></div>
                        <span>{server.Group.name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`capitalize font-medium ${getServerStatusColor(server.status)}`}>
                        {server.status}
                      </span>
                      {server.responseTime && (
                        <span className="text-xs">{server.responseTime}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {servers.length > 6 && (
            <div className="text-center mt-4">
              <button 
                onClick={() => window.location.href = '/monitoring'}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View all {servers.length} servers →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="mr-2" size={20} />
          Recent Activity
        </h3>
        
        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {activity.action} on {activity.serverName}
                    </p>
                    <p className="text-xs text-gray-400">
                      by {activity.user} • {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium capitalize ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))}
            
            {recentActivity.length > 5 && (
              <div className="text-center pt-2">
                <button 
                  onClick={() => window.location.href = '/logs'}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View all activity →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;