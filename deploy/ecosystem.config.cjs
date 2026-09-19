// PM2 process definition for the DigitalOcean droplet.
//   pm2 start deploy/ecosystem.config.cjs && pm2 save
// Secrets stay in the project's .env (loaded by Next.js); only runtime flags live here.
const fs = require('fs');
const path = require('path');

// Automated deploys (deploy/deploy.sh) run the site from the `current` symlink; a manual/first start
// runs from this checkout.
const CURRENT = '/srv/mr-polaa/current';
const APP_DIR = fs.existsSync(CURRENT) ? CURRENT : path.join(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'mr-polaa',
      cwd: APP_DIR,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        // Attendance times and shop opening-hour checks use the server clock: keep it on Sri Lanka time
        TZ: 'Asia/Colombo',
        // 2 GB droplet: Node shares it with MySQL, so cap the heap and let the GC work harder instead of
        // growing (load-tested peak under 100 concurrent users was ~570 MB)
        NODE_OPTIONS: '--max-old-space-size=768',
      },
      max_memory_restart: '900M',
      autorestart: true,
      // Give in-flight requests a moment to finish on restart/deploy
      kill_timeout: 8000,
    },
  ],
};
