import React, { useState, useEffect } from 'react';
import { serversAPI, groupsAPI } from '../services/api';
import { Plus, Edit, Trash2, Server, Users, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface Group {
  id: number;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

interface ServerData {
  id?: number;
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  sshPort: number;
  sshUser: string;
  description: string;
  isActive: boolean;
  groupId: number | null;
  restartOrder: number;
  restartDelay: number;
  Group?: {
    id: number;
    name: string;
    color: string;
  };
}

interface GroupData {
  id?: number;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

const Servers: React.FC = () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'servers' | 'groups'>('servers');
  
  const [serverFormData, setServerFormData] = useState<ServerData>({
    name: '',
    hostname: '',
    ipAddress: '',
    port: 80,
    sshPort: 22,
    sshUser: 'root',
    description: '',
    isActive: true,
    groupId: null,
    restartOrder: 0,
    restartDelay: 0
  });

  const [groupFormData, setGroupFormData] = useState<GroupData>({
    name: '',
    description: '',
    color: '#3B82F6',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [serversData, groupsData] = await Promise.all([
        serversAPI.getAll(),
        groupsAPI.getAll()
      ]);
      setServers(serversData);
      setGroups(groupsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingServer) {
        await serversAPI.update(editingServer.id!, serverFormData);
        toast.success('Server updated successfully');
      } else {
        await serversAPI.create(serverFormData);
        toast.success('Server added successfully');
      }
      
      loadData();
      resetServerForm();
    } catch (error) {
      toast.error('Failed to save server');
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGroup) {
        await groupsAPI.update(editingGroup.id!, groupFormData);
        toast.success('Group updated successfully');
      } else {
        await groupsAPI.create(groupFormData);
        toast.success('Group added successfully');
      }
      
      loadData();
      resetGroupForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save group');
    }
  };

  const handleServerDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this server?')) return;
    
    try {
      await serversAPI.delete(id);
      toast.success('Server deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete server');
    }
  };

  const handleGroupDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    try {
      await groupsAPI.delete(id);
      toast.success('Group deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const resetServerForm = () => {
    setShowServerModal(false);
    setEditingServer(null);
    setServerFormData({
      name: '',
      hostname: '',
      ipAddress: '',
      port: 80,
      sshPort: 22,
      sshUser: 'root',
      description: '',
      isActive: true,
      groupId: null,
      restartOrder: 0,
      restartDelay: 0
    });
  };

  const resetGroupForm = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
    setGroupFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      isActive: true
    });
  };

  const startServerEdit = (server: ServerData) => {
    setEditingServer(server);
    setServerFormData(server);
    setShowServerModal(true);
  };

  const startGroupEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupFormData(group);
    setShowGroupModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Server Management</h1>
          <p className="text-gray-400">Manage your server configurations and groups</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'servers'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Server size={16} className="mr-2" />
          Servers ({servers.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'groups'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Users size={16} className="mr-2" />
          Groups ({groups.length})
        </button>
      </div>

      {/* Servers Tab */}
      {activeTab === 'servers' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Server className="mr-2" size={20} />
              Servers ({servers.length})
            </h2>
            <button
              onClick={() => setShowServerModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Server
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Hostname</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">IP:Port</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">SSH</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Group</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">{server.name}</div>
                      <div className="text-gray-400 text-sm">{server.description}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{server.hostname}</td>
                    <td className="py-4 px-6 text-gray-300">{server.ipAddress}:{server.port}</td>
                    <td className="py-4 px-6 text-gray-300">{server.sshUser}@{server.hostname}:{server.sshPort}</td>
                    <td className="py-4 px-6">
                      {server.Group ? (
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: server.Group.color }}
                          ></div>
                          <span className="text-gray-300">{server.Group.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No group</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        server.isActive 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-red-900/20 text-red-400'
                      }`}>
                        {server.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startServerEdit(server)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleServerDelete(server.id!)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {servers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-6 text-center text-gray-400">
                      No servers configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Users className="mr-2" size={20} />
              Groups ({groups.length})
            </h2>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Group
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Color</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Servers</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const serverCount = servers.filter(s => s.groupId === group.id).length;
                  return (
                    <tr key={group.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: group.color }}
                          ></div>
                          <span className="text-white font-medium">{group.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{group.description}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-600" 
                            style={{ backgroundColor: group.color }}
                          ></div>
                          <span className="text-gray-400 text-sm font-mono">{group.color}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{serverCount} server{serverCount !== 1 ? 's' : ''}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          group.isActive 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startGroupEdit(group)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleGroupDelete(group.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-6 text-center text-gray-400">
                      No groups configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Server Modal */}
      {showServerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingServer ? 'Edit Server' : 'Add Server'}
            </h3>
            
            <form onSubmit={handleServerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={serverFormData.name}
                    onChange={(e) => setServerFormData({ ...serverFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Hostname *
                  </label>
                  <input
                    type="text"
                    required
                    value={serverFormData.hostname}
                    onChange={(e) => setServerFormData({ ...serverFormData, hostname: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    IP Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={serverFormData.ipAddress}
                    onChange={(e) => setServerFormData({ ...serverFormData, ipAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="65535"
                    value={serverFormData.port}
                    onChange={(e) => setServerFormData({ ...serverFormData, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    SSH Port
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={serverFormData.sshPort}
                    onChange={(e) => setServerFormData({ ...serverFormData, sshPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    SSH User
                  </label>
                  <input
                    type="text"
                    value={serverFormData.sshUser}
                    onChange={(e) => setServerFormData({ ...serverFormData, sshUser: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Group
                </label>
                <select
                  value={serverFormData.groupId || ''}
                  onChange={(e) => setServerFormData({ ...serverFormData, groupId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No group</option>
                  {groups.filter(g => g.isActive).map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Restart Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={serverFormData.restartOrder}
                    onChange={(e) => setServerFormData({ ...serverFormData, restartOrder: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Restart Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={serverFormData.restartDelay}
                    onChange={(e) => setServerFormData({ ...serverFormData, restartDelay: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={serverFormData.description}
                  onChange={(e) => setServerFormData({ ...serverFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="serverActive"
                  checked={serverFormData.isActive}
                  onChange={(e) => setServerFormData({ ...serverFormData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="serverActive" className="text-gray-300">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetServerForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingServer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingGroup ? 'Edit Group' : 'Add Group'}
            </h3>
            
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={groupFormData.color}
                    onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                    className="w-12 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={groupFormData.color}
                    onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="groupActive"
                  checked={groupFormData.isActive}
                  onChange={(e) => setGroupFormData({ ...groupFormData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="groupActive" className="text-gray-300">
                  Active
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetGroupForm}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingGroup ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servers;