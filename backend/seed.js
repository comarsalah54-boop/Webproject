const bcrypt = require('bcryptjs');
const { User, Server, Group } = require('./models');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Create default groups
    const groups = [
      {
        name: 'Frontend',
        description: 'Frontend web servers',
        color: '#3B82F6'
      },
      {
        name: 'Backend',
        description: 'Backend application servers',
        color: '#10B981'
      },
      {
        name: 'Middleware',
        description: 'Middleware and integration servers',
        color: '#F59E0B'
      },
      {
        name: 'Database',
        description: 'Database servers',
        color: '#EF4444'
      },
      {
        name: 'Authentication',
        description: 'Authentication and security servers',
        color: '#8B5CF6'
      }
    ];

    const createdGroups = {};
    for (const groupData of groups) {
      const [group] = await Group.findOrCreate({
        where: { name: groupData.name },
        defaults: groupData
      });
      createdGroups[groupData.name] = group.id;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const [adminUser] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@assurnet.com',
        password: adminPassword,
        role: 'admin',
        permissions: {
          canMonitor: true,
          canRestart: true,
          canViewLogs: true,
          canManageServers: true,
          canManageUsers: true,
          canScheduleTasks: true
        }
      }
    });

    // Create demo user
    const userPassword = await bcrypt.hash('user123', 12);
    await User.findOrCreate({
      where: { username: 'operator' },
      defaults: {
        username: 'operator',
        email: 'operator@assurnet.com',
        password: userPassword,
        role: 'user',
        permissions: {
          canMonitor: true,
          canRestart: true,
          canViewLogs: true,
          canManageServers: false,
          canManageUsers: false,
          canScheduleTasks: false
        }
      }
    });

    // Create demo servers based on your infrastructure
    const servers = [
      {
        name: 'SiegeAssurnetFront',
        hostname: 'SiegeAssurnetFront',
        ipAddress: '192.168.1.10',
        port: 80,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Frontend'],
        restartOrder: 1,
        description: 'Main frontend web server'
      },
      {
        name: 'droolslot2',
        hostname: 'droolslot2',
        ipAddress: '192.168.1.11',
        port: 80,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Frontend'],
        restartOrder: 2,
        description: 'Drools business rules server'
      },
      {
        name: 'siegeawf',
        hostname: 'siegeawf',
        ipAddress: '192.168.1.12',
        port: 80,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Middleware'],
        restartOrder: 3,
        description: 'AWF middleware server'
      },
      {
        name: 'siegeasdrools',
        hostname: 'siegeasdrools',
        ipAddress: '192.168.1.13',
        port: 8080,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Middleware'],
        restartOrder: 4,
        description: 'AS Drools application server'
      },
      {
        name: 'siegeaskeycloak',
        hostname: 'siegeaskeycloak',
        ipAddress: '192.168.1.14',
        port: 8080,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Authentication'],
        restartOrder: 5,
        description: 'Keycloak authentication server'
      },
      {
        name: 'siegeasbackend',
        hostname: 'siegeasbackend',
        ipAddress: '192.168.1.15',
        port: 7001,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Backend'],
        restartOrder: 6,
        restartDelay: 30,
        description: 'Main backend application server'
      },
      {
        name: 'assurnetprod',
        hostname: 'assurnetprod',
        ipAddress: '192.168.1.16',
        port: 80,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Frontend'],
        restartOrder: 7,
        description: 'Production web server'
      },
      {
        name: 'SiegeAssurnetDigitale',
        hostname: 'SiegeAssurnetDigitale',
        ipAddress: '192.168.1.17',
        port: 7002,
        sshPort: 22,
        sshUser: 'root',
        groupId: createdGroups['Backend'],
        restartOrder: 8,
        description: 'Digital platform server'
      },
      {
        name: 'siegedbc',
        hostname: 'siegedbc',
        ipAddress: '192.168.1.18',
        port: 1521,
        sshPort: 22,
        sshUser: 'oracle',
        groupId: createdGroups['Database'],
        restartOrder: 0,
        description: 'Oracle database server (manual restart only)'
      }
    ];

    for (const serverData of servers) {
      await Server.findOrCreate({
        where: { hostname: serverData.hostname },
        defaults: serverData
      });
    }

    console.log('Database seeded successfully!');
    console.log('Default users created:');
    console.log('  Admin: admin / admin123');
    console.log('  Operator: operator / user123');
    console.log(`Created ${groups.length} server groups`);
    console.log(`Created ${servers.length} demo servers`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

module.exports = { seedDatabase };

// Run seeding if called directly
if (require.main === module) {
  const { sequelize } = require('./models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('Database connection established.');
      return sequelize.sync({ force: false });
    })
    .then(() => {
      console.log('Database models synchronized.');
      return seedDatabase();
    })
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}