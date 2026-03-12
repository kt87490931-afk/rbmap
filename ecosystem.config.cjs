/** @type {import('pm2').StartOptions} */
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'rbmap',
      script: 'server.js',
      cwd: path.join(__dirname, '.next/standalone'),
      node_args: '-r dotenv/config',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DOTENV_CONFIG_PATH: path.join(__dirname, '.next/standalone/.env.production'),
        NODE_PATH: path.join(__dirname, 'node_modules'),
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      error_file: path.join(__dirname, 'logs/rbmap-error.log'),
      out_file: path.join(__dirname, 'logs/rbmap-out.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
