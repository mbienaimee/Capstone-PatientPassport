# Patient Passport Netlify Deployment Guide

## 🚀 Netlify Deployment Configuration

### **Step 1: Fill in Netlify Settings**

**Project name:** `patient-passport-app`
- This will create the URL: `https://patient-passport-app.netlify.app`

**Branch to deploy:** `main` ✅ (already set)

### **Step 2: Build Settings**

**Base directory:** `frontend`
- This tells Netlify to look in the frontend folder for your React app

**Build command:** `npm run build`
- This runs TypeScript compilation and Vite build

**Publish directory:** `frontend/dist`
- This is where Vite outputs the built files

**Functions directory:** `netlify/functions`
- Leave as default

### **Step 3: Environment Variables**

Add these environment variables in Netlify:

```
VITE_API_URL=https://your-backend-api-url.com/api
VITE_OPENMRS_URL=https://your-openmrs-instance.com/openmrs
VITE_ENVIRONMENT=production
```

**Note:** Replace the URLs with your actual backend and OpenMRS URLs.

### **Step 4: Deploy**

Click "Deploy Capstone-PatientPassport" button.

## 📋 **Complete Netlify Form:**

| Field | Value |
|-------|-------|
| **Project name** | `patient-passport-app` |
| **Branch to deploy** | `main` |
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/dist` |
| **Functions directory** | `netlify/functions` |

## 🔧 **Environment Variables to Add:**

```
VITE_API_URL=https://your-backend-api-url.com/api
VITE_OPENMRS_URL=https://your-openmrs-instance.com/openmrs
VITE_ENVIRONMENT=production
```

## 📁 **Files Created:**

1. `netlify.toml` - Configuration file for Netlify
2. This deployment guide

## ✅ **What Happens After Deployment:**

1. Netlify will clone your repository
2. Navigate to the `frontend` directory
3. Run `npm install` to install dependencies
4. Run `npm run build` to build the project
5. Deploy the `frontend/dist` folder
6. Your app will be available at `https://patient-passport-app.netlify.app`

## 🔗 **Post-Deployment:**

1. **Update API URLs**: Make sure your backend and OpenMRS are accessible
2. **Test the application**: Visit your deployed URL and test all features
3. **Configure custom domain**: You can add a custom domain in Netlify settings
4. **Set up continuous deployment**: Every push to main will trigger a new deployment

## 🚨 **Important Notes:**

- Make sure your backend API is deployed and accessible
- Ensure OpenMRS is running and accessible
- Update environment variables with correct URLs
- Test all functionality after deployment

## 🎯 **Next Steps:**

1. Fill in the Netlify form with the values above
2. Add the environment variables
3. Click deploy
4. Wait for the build to complete
5. Test your deployed application
6. Share the URL with your team!

Your Patient Passport application will be live and accessible worldwide! 🌍











