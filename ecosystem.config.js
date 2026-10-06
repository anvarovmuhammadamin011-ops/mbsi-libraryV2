// Backend'ni PM2 ostida doimiy ishga tushirish uchun.
// Ishlatish:
//   pm2 start ecosystem.config.js
//   pm2 save                      <- joriy ro'yxatni saqlash
//   pm2 resurrect                  <- qayta yuklashda avtomatik tiklash
//   pm2 logs mbsi-library          <- loglarni ko'rish
module.exports = {
  apps: [
    {
      name: "mbsi-library",
      script: "node_modules/next/dist/bin/next",
      interpreter: "node",
      args: "dev",
      cwd: __dirname,
      autorestart: true,
      min_uptime: "5s",
      max_restarts: 100,
      restart_delay: 3000,
      time: true,
    },
  ],
};
