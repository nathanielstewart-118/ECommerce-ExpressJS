/**
 * PM2 Ecosystem Configuration
 * 
 * Commands:
 *   pm2 start ecosystem.config.js              - Start all apps
 *   pm2 start ecosystem.config.js --env production  - Start in production
 *   pm2 stop ecosystem.config.js               - Stop all apps
 *   pm2 restart ecosystem.config.js            - Restart all apps
 *   pm2 delete ecosystem.config.js             - Delete all apps
 *   pm2 logs                                   - View logs
 *   pm2 monit                                  - Monitor all processes
 *   pm2 save                                   - Save current process list
 *   pm2 startup                                - Generate startup script
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'express-backend',
      
      // Entry point
      script: './src/index.js',
      
      // Cluster mode - use all available CPUs
      instances: 'max',
      exec_mode: 'cluster',
      
      // Auto restart on crash
      autorestart: true,
      
      // Watch for file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],
      
      // Restart if memory exceeds 1GB
      max_memory_restart: '1G',
      
      // Restart delay
      restart_delay: 3000,
      
      // Maximum restarts within time window
      max_restarts: 10,
      min_uptime: '10s',
      
      // Log configuration
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Environment variables - Development
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      // Environment variables - Production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Environment variables - Staging
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      
      // Kill timeout
      kill_timeout: 5000,
      
      // Wait before forced restart
      wait_ready: true,
      listen_timeout: 10000,
      
      // Cron restart (optional - restart every day at midnight)
      // cron_restart: '0 0 * * *',
      
      // Source map support
      source_map_support: true,
      
      // Node arguments
      node_args: '--max-old-space-size=4096',
    },
    
    // Separate process for cron jobs (to avoid running multiple times in cluster)
    {
      name: 'express-backend-cron',
      script: './src/jobs/cron-runner.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      
      env: {
        NODE_ENV: 'development',
        CRON_ONLY: 'true',
      },
      
      env_production: {
        NODE_ENV: 'production',
        CRON_ONLY: 'true',
      },
      
      log_file: './logs/cron-combined.log',
      error_file: './logs/cron-error.log',
      out_file: './logs/cron-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      // Server user
      user: 'deploy',
      
      // Server host
      host: ['your-server-ip'],
      
      // SSH port
      port: '22',
      
      // Git repository
      ref: 'origin/main',
      repo: 'git@github.com:your-username/express-backend.git',
      
      // Deployment path
      path: '/var/www/express-backend',
      
      // Commands to run after deployment
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      
      // Pre-setup command
      'pre-setup': 'apt-get update && apt-get install -y git',
      
      // SSH options
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
      },
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      port: '22',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/express-backend.git',
      path: '/var/www/express-backend-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
