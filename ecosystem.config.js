/**
 * PM2 config: runs the backend API and the web panel.
 *
 * First time (and after every web change), build the web panel:
 *   (cd web && npm ci && npm run build)
 * Install backend deps once (keep dev deps — the API runs through `tsx`):
 *   (cd backend && npm ci --include=dev)
 *
 * Then, from the repo root:
 *   pm2 start ecosystem.config.js        # start both
 *   pm2 reload ecosystem.config.js       # restart after a deploy
 *   pm2 logs                             # tail logs
 *   pm2 save && pm2 startup              # start automatically on reboot
 *
 * Ports can be changed with env vars: API_PORT (default 3000), WEB_PORT (default 4173).
 */
const path = require("path");

const API_PORT = process.env.API_PORT || 3000;
const WEB_PORT = process.env.WEB_PORT || 4173;

module.exports = {
  apps: [
    {
      name: "attendance-api",
      cwd: path.join(__dirname, "backend"),
      script: "./node_modules/.bin/tsx",
      args: "index.ts",
      interpreter: "none",
      // Must stay a single instance: the server also runs the cron job that
      // rotates the QR token, and several instances would fight over it.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      restart_delay: 3000,
      time: true, // timestamps in logs
      env: {
        NODE_ENV: "production",
        PORT: API_PORT,
        // Everything else (DATABASE_URL, JWT_SECRET, GOOGLE_SHEET_ID, …) is read from backend/.env
      },
    },
    {
      name: "attendance-web",
      // PM2's built-in static server; serves the Vite build in web/dist.
      script: "serve",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      time: true,
      env: {
        PM2_SERVE_PATH: path.join(__dirname, "web", "dist"),
        PM2_SERVE_PORT: WEB_PORT,
        PM2_SERVE_SPA: "true", // send index.html for client-side routes like /attendence/history
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
    },
  ],
};
