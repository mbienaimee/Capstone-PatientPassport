#!/bin/bash
# Azure App Service Environment Variables Setup Script
# Run this script to configure your Azure backend with proper environment variables

# Configuration
RESOURCE_GROUP="your-resource-group-name"
APP_SERVICE_NAME="patientpassport-api"
FRONTEND_URL="https://your-frontend-domain.netlify.app"

echo "🚀 Setting up Azure App Service Environment Variables..."

# Set environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_SERVICE_NAME \
  --settings \
    NODE_ENV=production \
    PORT=5000 \
    MONGODB_URI="mongodb+srv://reine:KgzYIrHtPXg4Xfc3@cluster0.fslpg5p.mongodb.net/CapstonePassportSystem?retryWrites=true&w=majority" \
    JWT_SECRET="0f993f5a094c9ffaf8c153919b9839d165b42b02ea21d2cfbc2785d1aaa45418b7af25421166fd3f15c1e55d41230ded642348f11d2d11238ac059cf4494859b" \
    JWT_EXPIRE=7d \
    JWT_REFRESH_SECRET="af8a4a50a3634c2203a3b57429918d6844fd8092f2000317e518e860eb8656b8e7238e9ec6989cf678f75612045d8c2b57d9f151935d725cc0a3c79aaae24dff" \
    JWT_REFRESH_EXPIRE=30d \
    JWT_RESET_SECRET="896f59d1648b5d07d2dac91ba1b06f473e8dea6239b00d8e9cba33a64fdb7c23a6f833640f595c81132fbb650ef126e0136485b7bef335c26468ce810509de5b" \
    JWT_RESET_EXPIRE=10m \
    EMAIL_HOST=smtp.gmail.com \
    EMAIL_PORT=587 \
    EMAIL_USER=reine123e@gmail.com \
    EMAIL_PASS="ehkx uewt etaq sylo" \
    EMAIL_FROM="PatientPassport <reine123e@gmail.com>" \
    BCRYPT_ROUNDS=12 \
    SESSION_SECRET="76c8b849d6316b22ea9441dff8099edbd6fcbe6ed4907ba91fbffda82efed30f" \
    CSRF_SECRET="8605b51fb01ef6685f121984176f186fdff2c09d88a895cb8fd1a4e986c004da" \
    CORS_ORIGIN=$FRONTEND_URL

echo "✅ Environment variables set successfully!"

# Restart the App Service
echo "🔄 Restarting App Service..."
az webapp restart --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME

echo "🎉 Setup complete! Your Azure backend should now work properly."
echo "📝 Test your API at: https://$APP_SERVICE_NAME.azurewebsites.net/api/auth/me"
