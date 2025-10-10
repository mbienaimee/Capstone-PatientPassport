#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Start the application
const startApp = () => {
  console.log('Starting PatientPassport Backend API...\n');
  
  const appPath = path.join(__dirname, '..', 'dist', 'app.js');
  const child = spawn('node', [appPath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  child.on('error', (error) => {
    console.error(' Failed to start application:', error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    console.log(`\n Application exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n Shutting down gracefully...');
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n Shutting down gracefully...');
    child.kill('SIGTERM');
  });
};

startApp();











































