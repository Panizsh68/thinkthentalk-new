module.exports = {
  apps: [
    {
      name: "thinkthentalk-backend",
      cwd: __dirname,
      script: "dist/src/main.js",
      env_file: ".env.production",
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
