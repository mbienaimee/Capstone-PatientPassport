# Git DNS Resolution Fix Guide

## Issue
`fatal: unable to access 'https://github.com/mbienaimee/Capstone-PatientPassport.git/': Could not resolve host: github.com`

## Solutions (Try in Order)

### Solution 1: Configure Git to Use IPv4 Only
```bash
# Set Git to prefer IPv4
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
```

### Solution 2: Flush DNS Cache
```powershell
# Run as Administrator
ipconfig /flushdns
ipconfig /registerdns
```

### Solution 3: Configure Git DNS Settings
```bash
# Set explicit DNS settings for Git
git config --global http.sslVerify true
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 0
```

### Solution 4: Use SSH Instead of HTTPS
```bash
# Check if you have SSH keys
ls ~/.ssh/id_rsa.pub

# If not, generate one
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy the public key and add it to GitHub
cat ~/.ssh/id_rsa.pub

# Change remote to SSH
git remote set-url origin git@github.com:mbienaimee/Capstone-PatientPassport.git

# Test connection
ssh -T git@github.com
```

### Solution 5: Configure System DNS
1. Open **Network Settings**
2. Go to **Change adapter options**
3. Right-click your network adapter → **Properties**
4. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
5. Choose **Use the following DNS server addresses**:
   - Preferred: `8.8.8.8` (Google DNS)
   - Alternate: `8.8.4.4` (Google DNS)

### Solution 6: Use Git with Proxy (if behind corporate firewall)
```bash
# If you're behind a proxy, configure it
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy https://proxy.example.com:8080

# To remove proxy later
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### Solution 7: Test and Verify
```bash
# Test DNS resolution
nslookup github.com

# Test HTTPS connection
curl -I https://github.com

# Try git push again
git push origin main
```

## Quick Fix Script (Run in PowerShell as Admin)
```powershell
# Flush DNS
ipconfig /flushdns

# Configure Git
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000

# Test connection
Test-NetConnection github.com -Port 443
```

