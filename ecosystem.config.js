module.exports = {
  apps: [
    {
      name: 'clothes-erp',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/clothes-erp',
      env: {
        NODE_ENV: 'production',
        PORT: 1111
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'clothes-erp-whatsapp',
      script: 'server.js',
      cwd: '/var/www/clothes-erp/whatsapp-service',
      env: {
        NODE_ENV: 'production',
        PORT: 1112
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
}
