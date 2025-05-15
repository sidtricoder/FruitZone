// free-port.js - Script to free up the backend port
// This is useful when the port is already in use by another process
require('dotenv').config();
const { exec } = require('child_process');

// Get the port from environment variable or use default
const port = process.env.PORT || 5002;

console.log(`Attempting to free up port ${port}...`);

// More comprehensive approach for Windows
// First find the PID using the port
const findPidCommand = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`;

exec(findPidCommand, (error, stdout, stderr) => {
  if (error && !stdout.trim()) {
    console.error(`Error finding process: ${error.message}`);
    console.log("No process found using this port. Port may already be free.");
    return;
  }
  
  const pid = stdout.trim();
  if (!pid) {
    console.log(`No process found using port ${port}. The port is already free.`);
    return;
  }
  
  console.log(`Found process with PID ${pid} using port ${port}. Attempting to kill it...`);
  
  // Now kill the process
  const killCommand = `powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`;
  
  exec(killCommand, (killError, killStdout, killStderr) => {
    if (killError) {
      console.error(`Error killing process: ${killError.message}`);
      return;
    }
    
    console.log(`Successfully killed process with PID ${pid}.`);
    console.log(`Port ${port} has been freed successfully.`);
    console.log(`You can now start the server using: npm run dev`);
  });
});
