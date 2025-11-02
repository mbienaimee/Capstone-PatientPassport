# Git DNS Resolution Fix - SSH Method

## Problem
`fatal: unable to access 'https://github.com/mbienaimee/Capstone-PatientPassport.git/': Could not resolve host: github.com`

This is a DNS resolution issue with HTTPS Git URLs.

## Solution: Use SSH Instead of HTTPS

### Why SSH Works
- SSH uses different network protocols
- Bypasses DNS resolution issues with HTTPS
- More reliable for Windows networks
- Better authentication security

### Status
✅ **SSH is already configured and working!**
The test `ssh -T git@github.com` shows: "Hi mbienaimee! You've successfully authenticated"

### Remote URL Updated
Changed from:
```
https://github.com/mbienaimee/Capstone-PatientPassport.git
```

To:
```
git@github.com:mbienaimee/Capstone-PatientPassport.git
```

## Next Steps

### Try pushing again:
```bash
git push origin main
```

This should now work with SSH authentication!

### If SSH still has issues:

1. **Check SSH key exists:**
   ```bash
   ls ~/.ssh/id_rsa.pub
   ```

2. **Generate SSH key if missing:**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ```

3. **Add SSH key to GitHub:**
   - Copy public key: `cat ~/.ssh/id_rsa.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the key and save

4. **Test connection:**
   ```bash
   ssh -T git@github.com
   ```

### Alternative: Fix DNS for HTTPS

If you prefer HTTPS, configure Windows DNS:

1. **Change DNS Servers:**
   - Network Settings → Wi-Fi → Properties
   - IPv4 Properties → Use following DNS:
     - Preferred: `8.8.8.8` (Google DNS)
     - Alternate: `8.8.4.4` (Google DNS)

2. **Flush DNS Cache:**
   ```powershell
   ipconfig /flushdns
   ```

3. **Test DNS:**
   ```powershell
   nslookup github.com 8.8.8.8
   ```

## Current Status
- ✅ SSH authentication: Working
- ✅ Remote URL: Updated to SSH
- ⚠️ HTTPS DNS: Still having issues (use SSH instead)

