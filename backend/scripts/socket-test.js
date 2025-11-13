// Simple socket.io-client test script against deployed backend
// Usage: node socket-test.js --url https://patientpassport-api.azurewebsites.net

const { io } = require('socket.io-client');

const argv = require('minimist')(process.argv.slice(2));
const url = (argv.url || argv.u || 'https://patientpassport-api.azurewebsites.net').replace(/\/$/, '');

console.log('Connecting to', url);

const socket = io(url, {
  reconnectionAttempts: 3,
  transports: ['websocket', 'polling'],
  timeout: 10000
});

socket.on('connect', () => {
  console.log('Connected, id=', socket.id);
  socket.disconnect();
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err && err.message ? err.message : err);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  process.exit(0);
});
