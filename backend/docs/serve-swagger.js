#!/usr/bin/env node

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const PORT = process.env.SWAGGER_PORT || 3001;

// Load the YAML file
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yml'));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #059669 }
    .swagger-ui .scheme-container { background: #f0fdf4; padding: 10px; border-radius: 5px; }
  `,
  customSiteTitle: 'PatientPassport API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

// Serve the raw YAML file
app.get('/swagger.yml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.sendFile(path.join(__dirname, 'swagger.yml'));
});

// Serve JSON version
app.get('/swagger.json', (req, res) => {
  res.json(swaggerDocument);
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Swagger documentation server is running',
    timestamp: new Date().toISOString(),
    documentation: '/api-docs',
    yaml: '/swagger.yml',
    json: '/swagger.json'
  });
});

app.listen(PORT, () => {
  console.log(`
📚 PatientPassport API Documentation Server
📍 Server: http://localhost:${PORT}
📖 Documentation: http://localhost:${PORT}/api-docs
📄 YAML File: http://localhost:${PORT}/swagger.yml
🔧 JSON File: http://localhost:${PORT}/swagger.json
🏥 Health Check: http://localhost:${PORT}/health
  `);
});





































