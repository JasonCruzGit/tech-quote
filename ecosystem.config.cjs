/**
 * PM2 process file for Hostinger VPS / Node.js hosting.
 *
 * Usage on the server:
 *   npm ci
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "tech-quote",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Keep one SQLite writer — do not scale to multiple instances
      max_memory_restart: "512M",
      watch: false,
    },
  ],
};
