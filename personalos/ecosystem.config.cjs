module.exports = {
  apps: [
    {
      name: 'msos-laravel',
      script: 'php',
      args: 'artisan serve --host=0.0.0.0 --port=8000',
      cwd: '/Users/michaelenriquez/PersonalOS/personalos',
      watch: false,
      autorestart: true,
    },
    {
      name: 'msos-agent',
      script: 'npx',
      args: 'tsx src/index.ts',
      cwd: '/Users/michaelenriquez/PersonalOS/personalos/agent',
      watch: false,
      autorestart: true,
    },
  ],
};
