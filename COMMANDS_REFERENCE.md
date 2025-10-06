# 🛠️ Patient Passport - Commands Reference

## 🚀 Quick Start Commands

### One-Command Setup
```powershell
# Complete setup (Windows)
.\setup-patient-passport.ps1

# Manual setup
git clone <repository-url>
cd Capstone-PatientPassport
npm install
docker-compose up -d
```

## 📦 Package Management

### Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Patient Passport Service
cd patient-passport-service && npm install

# All at once
npm install
```

### Build Applications
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build

# All at once
npm run build
```

## 🐳 Docker Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d mongodb
docker-compose up -d mysql
docker-compose up -d openmrs-platform
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop specific service
docker-compose stop mongodb
docker-compose stop mysql
docker-compose stop openmrs-platform
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs openmrs-platform
docker-compose logs mongodb
docker-compose logs mysql

# Follow logs
docker-compose logs -f openmrs-platform
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker restart openmrs-platform
docker restart mongodb
docker restart mysql
```

## 🏥 OpenMRS Commands

### Module Management
```bash
# Create module file
.\create-omod-file.ps1

# Deploy module
docker cp patientpassportcore-1.0.0.omod openmrs-platform:/usr/local/tomcat/.OpenMRS/modules/

# Restart OpenMRS
docker restart openmrs-platform

# Check module status
docker exec openmrs-platform ls -la /usr/local/tomcat/.OpenMRS/modules/
```

### OpenMRS Logs
```bash
# View OpenMRS logs
docker logs openmrs-platform

# Follow logs
docker logs -f openmrs-platform

# Last 50 lines
docker logs --tail 50 openmrs-platform
```

## 🗄️ Database Commands

### MongoDB
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/patient-passport

# Backup database
mongodump --db patient-passport --out backup/

# Restore database
mongorestore --db patient-passport backup/patient-passport/

# Check MongoDB status
docker exec mongodb mongo --eval "db.stats()"
```

### MySQL (OpenMRS)
```bash
# Connect to MySQL
mysql -h localhost -u openmrs -p openmrs

# Backup database
mysqldump -u openmrs -p openmrs > openmrs_backup.sql

# Restore database
mysql -u openmrs -p openmrs < openmrs_backup.sql

# Check MySQL status
docker exec mysql mysql -u openmrs -p -e "SHOW DATABASES;"
```

## 🌐 Development Commands

### Start Development Servers
```bash
# All services
npm run dev

# Frontend only
cd frontend && npm start

# Backend only
cd backend && npm run dev

# Patient Passport Service
cd patient-passport-service && npm run dev
```

### Testing
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# All tests
npm test
```

### Linting
```bash
# Frontend linting
cd frontend && npm run lint

# Backend linting
cd backend && npm run lint

# Fix linting issues
cd frontend && npm run lint:fix
cd backend && npm run lint:fix
```

## 🔧 System Commands

### Port Management
```bash
# Check what's using a port
netstat -ano | findstr :3000
netstat -ano | findstr :8084
netstat -ano | findstr :27017
netstat -ano | findstr :3306

# Kill process by PID
taskkill /PID <process_id> /F

# Kill process by name
taskkill /IM node.exe /F
taskkill /IM java.exe /F
```

### Process Management
```bash
# List running processes
tasklist | findstr node
tasklist | findstr java
tasklist | findstr docker

# Kill all Node.js processes
taskkill /IM node.exe /F

# Kill all Java processes
taskkill /IM java.exe /F
```

## 🚀 Deployment Commands

### Frontend (Netlify)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd frontend
npm run build
netlify deploy --prod --dir=build

# Deploy with alias
netlify deploy --prod --dir=build --alias patient-passport
```

### Backend (Docker)
```bash
# Build Docker image
docker build -t patient-passport-api .

# Run container
docker run -d -p 3000:3000 --name patient-passport-api patient-passport-api

# Stop container
docker stop patient-passport-api

# Remove container
docker rm patient-passport-api
```

### Backend (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start backend/src/server.ts --name patient-passport-api

# Stop application
pm2 stop patient-passport-api

# Restart application
pm2 restart patient-passport-api

# View logs
pm2 logs patient-passport-api

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔍 Debugging Commands

### Check Service Status
```bash
# Docker containers
docker ps

# Docker images
docker images

# Docker volumes
docker volume ls

# Docker networks
docker network ls
```

### Check Logs
```bash
# All Docker logs
docker-compose logs

# Specific service logs
docker logs openmrs-platform
docker logs mongodb
docker logs mysql

# Follow logs in real-time
docker-compose logs -f
```

### Check Network
```bash
# Test connectivity
curl http://localhost:3000
curl http://localhost:8084/openmrs
curl http://localhost:27017

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:8084/openmrs/ws/rest/v1/module
```

## 🧹 Cleanup Commands

### Docker Cleanup
```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Remove everything unused
docker system prune -a
```

### Node.js Cleanup
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force frontend/node_modules
Remove-Item -Recurse -Force backend/node_modules
Remove-Item -Recurse -Force patient-passport-service/node_modules

# Reinstall dependencies
npm install
```

## 📊 Monitoring Commands

### System Resources
```bash
# CPU and Memory usage
docker stats

# Disk usage
docker system df

# Container resource usage
docker stats openmrs-platform
docker stats mongodb
docker stats mysql
```

### Application Health
```bash
# Check if services are responding
curl -f http://localhost:3000 || echo "Frontend not responding"
curl -f http://localhost:3000/api || echo "Backend API not responding"
curl -f http://localhost:8084/openmrs || echo "OpenMRS not responding"

# Check database connections
docker exec mongodb mongo --eval "db.runCommand('ping')"
docker exec mysql mysql -u openmrs -p -e "SELECT 1"
```

## 🆘 Emergency Commands

### Reset Everything
```bash
# Stop all services
docker-compose down

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Remove all volumes
docker volume rm $(docker volume ls -q)

# Start fresh
docker-compose up -d
```

### Quick Fixes
```bash
# Restart everything
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Reset OpenMRS
docker restart openmrs-platform
docker restart mysql

# Reset databases
docker restart mongodb
docker restart mysql
```

---

## 📝 Notes

- **Always backup your data** before running cleanup commands
- **Check logs** when services fail to start
- **Use `docker-compose logs -f`** to follow logs in real-time
- **Test connectivity** with `curl` commands
- **Monitor resources** with `docker stats`

---

*Last Updated: October 6, 2025*





