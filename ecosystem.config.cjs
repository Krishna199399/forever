module.exports = {
  apps: [
    {
      name: 'forever-us-api',
      script: './server/src/index.js',
      node_args: '--dns-result-order=ipv4first',
      instances: 1, // Private app, single instance is sufficient
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        // The following values should be overridden by actual environment variables on the VPS,
        // or set securely in the server's .env file.
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
