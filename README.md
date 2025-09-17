# Assurnet Orchestration - Server Monitoring & Management Platform

A comprehensive server monitoring and restart management system with a modern web interface, designed specifically for Assurnet's infrastructure management needs.

## 🚀 Features

- **Real-time Dashboard** with automatic monitoring and live updates
- **Server Management** with full CRUD operations and group organization
- **Authentication System** with role-based permissions and security
- **Comprehensive Logging** with audit trails and downloadable reports
- **Email Alerts** for server outages and maintenance notifications
- **Task Scheduling** with automated restart planning and notifications
- **Flexible Server Selection** for targeted restart operations
- **Secure REST API** with JWT authentication and rate limiting
- **Group Management** for organizing servers by function or location

## 📋 Prerequisites

- **Operating System**: Oracle Linux 8.10+ (or compatible Linux distribution)
- **Docker**: Version 26.1.3 or higher
- **Docker Compose**: Latest version
- **SSH Access**: Passwordless SSH access to target servers
- **Network**: Connectivity to all managed servers

## 🛠 Installation & Setup

### 1. Clone and Prepare the Project

```bash
# Create project directory
sudo mkdir -p /opt/assurnet-orchestration
cd /opt/assurnet-orchestration

# Copy all project files to this directory
# (Copy the entire project structure here)
```

### 2. Configure Environment Variables

Edit the `docker-compose.yml` file to update the environment variables:

```yaml
# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=assurnet_orchestration
DB_USER=postgres
DB_PASSWORD=AssurnetDB2024!  # Change this password

# JWT Secret (CRITICAL: Change this in production)
JWT_SECRET=Assurnet2024!SecureJWTKey#OrchestrationPlatform

# Email Configuration (Microsoft 365/Outlook)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orchestration@assurnet.com  # Your email
SMTP_PASS=YourEmailPassword           # Your app password
ADMIN_EMAILS=admin@assurnet.com,it@assurnet.com
```

### 3. SSH Configuration for Server Access

Configure passwordless SSH access to your servers:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -C "assurnet-orchestration"

# Copy public key to each server
ssh-copy-id root@your-server-hostname

# Test SSH access (should not prompt for password)
ssh root@your-server-hostname "echo 'SSH connection successful'"
```

### 4. Deploy the Application

```bash
# Build and start all services
docker compose up -d --build

# Check if services are running
docker compose ps

# View logs if needed
docker compose logs -f
```

### 5. Initialize the Database

```bash
# Run database seeding (creates default users and demo servers)
docker compose exec backend node seed.js
```

## 🔐 Default Access Credentials

After initialization, you can log in with these default accounts:

- **Administrator Account**
  - Username: `admin`
  - Password: `admin123`
  - Permissions: Full system access

- **Operator Account**
  - Username: `operator`
  - Password: `user123`
  - Permissions: Monitor, restart, view logs

## 🌐 Application Access

- **Web Interface**: http://localhost:3000
- **API Endpoint**: http://localhost:5000/api
- **Database**: localhost:5432

## 📊 Server Configuration

The system comes pre-configured with your server infrastructure:

### Default Server Groups

1. **Frontend** - Web servers and user interfaces
2. **Backend** - Application servers and APIs
3. **Middleware** - Integration and processing servers
4. **Database** - Database servers (manual restart only)
5. **Authentication** - Security and auth servers

### Pre-configured Servers

- **SiegeAssurnetFront** (Frontend, Port 80)
- **droolslot2** (Frontend, Port 80)
- **siegeawf** (Middleware, Port 80)
- **siegeasdrools** (Middleware, Port 8080)
- **siegeaskeycloak** (Authentication, Port 8080)
- **siegeasbackend** (Backend, Port 7001)
- **assurnetprod** (Frontend, Port 80)
- **SiegeAssurnetDigitale** (Backend, Port 7002)
- **siegedbc** (Database, Port 1521) - Manual restart only

## 🔧 Key Features Explained

### Why Ping and Restart Issues Were Fixed

**Previous Issues:**
1. **Ping Problems**: The monitoring service was using basic ping without proper error handling
2. **Restart Failures**: SSH connections were timing out due to insufficient connection parameters
3. **User Registration**: Missing validation for first user creation

**Solutions Implemented:**
1. **Enhanced Ping Monitoring**: 
   - Cross-platform ping support (Windows/Linux)
   - Proper timeout handling (10 seconds)
   - Fallback to TCP connection testing
   - Detailed error logging

2. **Improved SSH Restart Process**:
   - Added connection timeout settings
   - Implemented proper SSH parameters (`ServerAliveInterval`, `ConnectTimeout`)
   - Enhanced error handling for connection drops during reboot
   - Support for custom SSH users and ports

3. **Fixed User Registration**:
   - First user automatically becomes admin
   - Proper validation and error handling
   - JWT token includes all necessary user information

### Group Management System

The new group management system allows you to:
- **Organize servers** by function, location, or environment
- **Color-code groups** for visual identification
- **Bulk operations** on server groups
- **Prevent accidental deletions** of groups with servers

### Enhanced Scheduling

The scheduler now includes:
- **Minimum 1-hour advance** scheduling to prevent immediate execution errors
- **Email notifications** with customizable recipient lists
- **Visual time validation** showing current time vs scheduled time
- **Server group integration** for easier server selection

## 📝 Usage Guide

### Adding New Servers

1. Navigate to **Servers** → **Servers** tab
2. Click **Add Server**
3. Fill in server details:
   - Name, hostname, IP address
   - Service port and SSH configuration
   - Group assignment
   - Restart order and delay settings
4. Test connectivity from the monitoring page

### Creating Server Groups

1. Navigate to **Servers** → **Groups** tab
2. Click **Add Group**
3. Configure:
   - Group name and description
   - Color for visual identification
   - Active status

### Scheduling Maintenance

1. Go to **Scheduler**
2. Click **Schedule Task**
3. Configure:
   - Task name and description
   - Select target servers
   - Set execution time (minimum 1 hour ahead)
   - Optional email notifications

### Downloading Logs

1. Navigate to **Logs & Audit**
2. Choose **Restart Logs** or **Monitor Logs**
3. Click **Download** button
4. Files are saved with descriptive names including date

## 🔍 Monitoring & Troubleshooting

### View Application Logs

```bash
# View all service logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs database

# Follow logs in real-time
docker compose logs -f backend
```

### Check Service Status

```bash
# Check if all services are running
docker compose ps

# Restart a specific service
docker compose restart backend

# Rebuild and restart all services
docker compose up -d --build
```

### Database Management

```bash
# Access database directly
docker compose exec database psql -U postgres -d assurnet_orchestration

# Create database backup
docker compose exec database pg_dump -U postgres assurnet_orchestration > backup.sql

# Restore from backup
docker compose exec -T database psql -U postgres assurnet_orchestration < backup.sql
```

### SSH Troubleshooting

```bash
# Test SSH connectivity from the backend container
docker compose exec backend ssh -o ConnectTimeout=10 root@your-server-hostname "echo 'Connection test'"

# Check SSH key permissions
ls -la ~/.ssh/
```

## 🔒 Security Considerations

### Production Deployment

1. **Change Default Passwords**: Update all default passwords in `docker-compose.yml`
2. **Secure JWT Secret**: Use a strong, unique JWT secret key
3. **SSL/TLS**: Configure reverse proxy with SSL certificates
4. **Firewall**: Restrict access to necessary ports only
5. **SSH Keys**: Use dedicated SSH keys with limited permissions
6. **Email Security**: Use app passwords for email authentication

### Network Security

```bash
# Example firewall configuration
sudo firewall-cmd --permanent --add-port=3000/tcp  # Web interface
sudo firewall-cmd --permanent --add-port=5000/tcp  # API (if needed externally)
sudo firewall-cmd --reload
```

## 📈 Performance Optimization

### Resource Requirements

- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage
- **Database**: Additional 2GB RAM for PostgreSQL

### Scaling Considerations

- Monitor database size and implement log rotation
- Consider Redis for session management in multi-instance deployments
- Use load balancer for high availability setups

## 🆘 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review system logs and performance metrics
2. **Monthly**: Update Docker images and security patches
3. **Quarterly**: Database maintenance and backup verification
4. **Annually**: Security audit and password rotation

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Server shows offline | Network/firewall | Check connectivity and firewall rules |
| SSH restart fails | Key permissions | Verify SSH key setup and permissions |
| Email alerts not working | SMTP config | Check email settings and app passwords |
| High CPU usage | Too frequent monitoring | Adjust monitoring intervals |

### Getting Help

1. **Check Logs**: Always start with `docker compose logs`
2. **Verify Configuration**: Ensure all environment variables are correct
3. **Test Connectivity**: Verify network access to target servers
4. **Review Documentation**: Check this README for configuration details

## 📄 License & Support

This system is designed specifically for Assurnet's infrastructure management needs. For technical support or feature requests, contact the IT administration team.

---

**Assurnet Orchestration Platform** - Streamlining server management with modern technology and robust monitoring capabilities.