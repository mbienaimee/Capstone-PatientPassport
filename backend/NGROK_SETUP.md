# 🚀 Quick ngrok Setup for USSD Testing

## ✅ What You've Already Done
- ✅ Backend is running and working perfectly
- ✅ USSD endpoint tested locally and confirmed working
- ✅ All USSD flow steps verified

## 📥 Step-by-Step ngrok Installation

### 1. Download ngrok
Browser should have opened to: https://ngrok.com/download

**If not, go there now and:**
- Click "Download for Windows"
- Save the ZIP file

### 2. Extract and Place ngrok.exe
```powershell
# Create ngrok folder
New-Item -ItemType Directory -Path C:\Users\user\ngrok -Force

# After extracting the ZIP, move ngrok.exe to:
# C:\Users\user\ngrok\ngrok.exe
```

### 3. Sign Up for FREE ngrok Account
Browser should have opened to: https://dashboard.ngrok.com/signup

**Create a free account using:**
- Email
- Google
- GitHub

### 4. Get Your Authtoken
After signup, go to: https://dashboard.ngrok.com/get-started/your-authtoken

**Copy your authtoken** (looks like: `2abc123def456ghi789_jkl0mnoPQRstuVWxyz`)

### 5. Configure ngrok
```powershell
# Run this command with YOUR authtoken
C:\Users\user\ngrok\ngrok.exe config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 6. Start ngrok
```powershell
# Start ngrok to expose port 5000
C:\Users\user\ngrok\ngrok.exe http 5000
```

You'll see output like:
```
Session Status                online
Forwarding                    https://abcd-12-34-56-78.ngrok-free.app -> http://localhost:5000
```

**COPY the https URL!**

### 7. Test with Africa's Talking Simulator

**Go to:** https://developers.africastalking.com/simulator

**Click "USSD" tab**

**Enter:**
- Callback URL: `https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/callback`
- USSD Code: `*384*40767#`
- Phone: `+250788123456`

**Click "Start Session"**

### 8. Verify It Works!

You should see the USSD menu:
```
Choose a language / Hitamo ururimi
1. English
2. Kinyarwanda
```

---

## 🎯 Quick Commands

```powershell
# Create ngrok directory
New-Item -ItemType Directory -Path C:\Users\user\ngrok -Force

# After placing ngrok.exe there, configure it
C:\Users\user\ngrok\ngrok.exe config add-authtoken YOUR_TOKEN

# Start ngrok
C:\Users\user\ngrok\ngrok.exe http 5000

# Check if it's working (in another terminal)
Invoke-WebRequest http://localhost:4040/api/tunnels | ConvertFrom-Json | Select-Object -ExpandProperty tunnels
```

---

## ⚠️ Important Notes

1. **Keep backend running** - Don't close the PowerShell window where backend is running
2. **Keep ngrok running** - Don't close the window where ngrok is running
3. **Free tier limitation** - URL changes each time you restart ngrok
4. **Browser errors are normal** - Errors in AT simulator console are from their website, not your code

---

## 🆘 Troubleshooting

### ngrok command not found
```powershell
# Use full path
C:\Users\user\ngrok\ngrok.exe http 5000
```

### "authtoken not configured"
```powershell
# Configure your authtoken first
C:\Users\user\ngrok\ngrok.exe config add-authtoken YOUR_TOKEN
```

### "address already in use"
```powershell
# Backend is not running on port 5000
cd C:\Users\user\OneDrive\Desktop\BIENAIMEE\Capstone-PatientPassport\backend
npm run dev
```

---

## ✅ Success Checklist

- [ ] Downloaded ngrok.exe
- [ ] Placed in C:\Users\user\ngrok\
- [ ] Signed up for ngrok account
- [ ] Got authtoken from dashboard
- [ ] Configured authtoken: `ngrok config add-authtoken`
- [ ] Started ngrok: `ngrok http 5000`
- [ ] Copied ngrok https URL
- [ ] Configured Africa's Talking simulator with callback URL
- [ ] Tested USSD flow successfully

---

**Once you complete these steps, your USSD will work in the Africa's Talking simulator! 🎉**
