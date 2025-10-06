# 🔧 Patient Passport - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Port Already in Use

#### Error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### Solution:
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <process_id> /F

# Or kill all Node.js processes
taskkill /IM node.exe /F
```

### 2. Docker Not Running

#### Error:
```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/containers/json": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

#### Solution:
```bash
# Start Docker Desktop
Start-Process "Docker Desktop"

# Or manually
& "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait for Docker to start
Start-Sleep -Seconds 30
```

### 3. OpenMRS Not Accessible

#### Error:
```
This page isn't working
localhost didn't send any data.
ERR_EMPTY_RESPONSE
```

#### Solution:
```bash
# Check if OpenMRS is running
docker ps | findstr openmrs

# Check OpenMRS logs
docker logs openmrs-platform

# Restart OpenMRS
docker restart openmrs-platform

# Wait for startup (2-3 minutes)
Start-Sleep -Seconds 180
```

### 4. Database Connection Issues

#### MongoDB Connection Error:
```
MongoError: failed to connect to server
```

#### Solution:
```bash
# Check MongoDB status
docker ps | findstr mongo

# Start MongoDB
docker start mongodb

# Check MongoDB logs
docker logs mongodb

# Restart MongoDB
docker restart mongodb
```

#### MySQL Connection Error:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

#### Solution:
```bash
# Check MySQL status
docker ps | findstr mysql

# Start MySQL
docker start mysql

# Wait for MySQL to initialize
Start-Sleep -Seconds 30

# Check MySQL logs
docker logs mysql
```

### 5. OpenMRS Module Not Loading

#### Error:
```
Invalid module config version . Valid are 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.0
```

#### Solution:
```bash
# Recreate module with correct config
.\create-omod-file.ps1

# Deploy updated module
docker cp patientpassportcore-1.0.0.omod openmrs-platform:/usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
docker restart openmrs-platform
```

### 6. CORS Issues

#### Error:
```
Access to fetch at 'http://localhost:3000/api' from origin 'http://localhost:3000' has been blocked by CORS policy
```

#### Solution:
```bash
# Check backend CORS configuration
# Ensure frontend URL is whitelisted in backend/src/app.ts

# Restart backend
cd backend
npm run dev
```

### 7. Build Failures

#### Frontend Build Error:
```
Module not found: Can't resolve 'react'
```

#### Solution:
```bash
# Clear cache and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

#### Backend Build Error:
```
Cannot find module 'express'
```

#### Solution:
```bash
# Clear cache and reinstall
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

### 8. Memory Issues

#### Error:
```
JavaScript heap out of memory
```

#### Solution:
```bash
# Increase Node.js memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Or for specific commands
node --max-old-space-size=4096 backend/src/server.ts
```

### 9. Permission Issues

#### Error:
```
EACCES: permission denied, open 'C:\path\to\file'
```

#### Solution:
```bash
# Run PowerShell as Administrator
# Or change file permissions
icacls "C:\path\to\file" /grant Everyone:F
```

### 10. Network Issues

#### Error:
```
Error: getaddrinfo ENOTFOUND localhost
```

#### Solution:
```bash
# Check hosts file
Get-Content C:\Windows\System32\drivers\etc\hosts

# Add localhost entry if missing
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 localhost"

# Flush DNS
ipconfig /flushdns
```

## 🔍 Diagnostic Commands

### Check System Status
```bash
# Check all running containers
docker ps

# Check all services
docker-compose ps

# Check system resources
docker stats

# Check disk usage
docker system df
```

### Check Application Health
```bash
# Test frontend
curl http://localhost:3000

# Test backend API
curl http://localhost:3000/api/health

# Test OpenMRS
curl http://localhost:8084/openmrs

# Test databases
docker exec mongodb mongo --eval "db.runCommand('ping')"
docker exec mysql mysql -u openmrs -p -e "SELECT 1"
```

### Check Logs
```bash
# All services
docker-compose logs

# Specific service
docker logs openmrs-platform
docker logs mongodb
docker logs mysql

# Follow logs
docker-compose logs -f
```

## 🆘 Emergency Reset

### Complete Reset
```bash
# Stop all services
docker-compose down

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Remove all volumes
docker volume rm $(docker volume ls -q)

# Remove all networks
docker network prune -f

# Start fresh
docker-compose up -d
```

### Partial Reset
```bash
# Reset OpenMRS only
docker stop openmrs-platform
docker rm openmrs-platform
docker run -d --name openmrs-platform -p 8084:8080 --link mysql:mysql openmrs/openmrs-distro-platform:2.5.0

# Reset databases only
docker restart mongodb
docker restart mysql

# Reset application only
docker-compose restart
```

## 📊 Performance Issues

### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart high-memory containers
docker restart openmrs-platform

# Increase Docker memory limit in Docker Desktop settings
```

### Slow Startup
```bash
# Check startup logs
docker-compose logs

# Wait longer for services to start
Start-Sleep -Seconds 300

# Check if all dependencies are running
docker ps
```

### Database Performance
```bash
# Check database logs
docker logs mongodb
docker logs mysql

# Restart databases
docker restart mongodb
docker restart mysql

# Check database connections
docker exec mongodb mongo --eval "db.runCommand('ping')"
docker exec mysql mysql -u openmrs -p -e "SHOW PROCESSLIST;"
```

## 🔧 Configuration Issues

### Environment Variables
```bash
# Check if .env files exist
Test-Path frontend\.env
Test-Path backend\.env

# Create missing .env files
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend\.env.example backend\.env
```

### Port Conflicts
```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :8084
netstat -ano | findstr :27017
netstat -ano | findstr :3306

# Kill conflicting processes
taskkill /PID <process_id> /F
```

### File Permissions
```bash
# Check file permissions
Get-Acl patientpassportcore-1.0.0.omod

# Fix permissions
icacls patientpassportcore-1.0.0.omod /grant Everyone:F
```

## 📞 Getting Help

### Log Collection
```bash
# Collect all logs
docker-compose logs > logs.txt
docker logs openmrs-platform > openmrs-logs.txt
docker logs mongodb > mongodb-logs.txt
docker logs mysql > mysql-logs.txt
```

### System Information
```bash
# Collect system info
systeminfo > system-info.txt
docker version > docker-version.txt
docker-compose version > docker-compose-version.txt
```

### Contact Information
- **Documentation**: [PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md](PATIENT_PASSPORT_PROJECT_DOCUMENTATION.md)
- **Commands Reference**: [COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)
- **Issues**: Create an issue in the repository

---

## 💡 Prevention Tips

1. **Always backup your data** before making changes
2. **Check logs regularly** to catch issues early
3. **Monitor system resources** to prevent memory issues
4. **Keep Docker and dependencies updated**
5. **Test connectivity** after each restart
6. **Use version control** for configuration changes

---

*Last Updated: October 6, 2025*





