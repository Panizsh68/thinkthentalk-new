module.exports = {
  apps: [
    {
      name: "think-backend",
      script: "dist/src/main.js",
      // env_file: ".env.production", // فعلاً حذفش کنیم که همه‌چیز واضح باشه
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",

        FRONTEND_URL: "https://thinkthentalk.ir",
        API_BASE_URL: "https://thinkthentalk.ir/api",
        APP_URL: "https://thinkthentalk.ir",
        PUBLIC_UPLOAD_PATH: "/uploads",
        STATIC_IMAGES_DIR: "/var/www/thinkthentalk/static-images",
        RESOURCE_FILES_DIR: "/var/www/thinkthentalk/resources",

        DB_HOST: "127.0.0.1",
        DB_PORT: "3306",
        DB_USER: "thinkuser",
        DB_PASSWORD: "123",
        DB_NAME: "think_then_talk_prod",
        DATABASE_URL: "mysql://thinkuser:123@127.0.0.1:3306/think_then_talk_prod",

        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: "6379",
        REDIS_PASSWORD: "ycT4vG9wKj3nLm2pR8sD1fV6xB0hNz5q",

        JWT_SECRET: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aDk5Y3N2clh6Rk1UYmJ3ZkhUUTNIWXJjSVp3Y25NQ3l2WjV0Y2I1bUdVYlJsZw",
        JWT_EXPIRES_IN: "3600s",
        SESSION_SECRET: "Hn1sC4jP6wY9qT2vX5zR8mLbE0dK7uSa",

        OTP_EXPIRATION_SECONDS: "300",
        OTP_RATE_LIMIT_PER_IP: "10",
        OTP_RATE_LIMIT_PER_MOBILE: "5",
        CONTACT_RATE_LIMIT_WINDOW: "60",
        CONTACT_RATE_LIMIT_COUNT: "1",

        ZARINPAL_MERCHANT_ID: "f1911c5f-deee-4c21-ae20-06a00877fd3d",
        ZARINPAL_CALLBACK_URL: "https://thinkthentalk.ir/api/payments/callback",
        ZARINPAL_SANDBOX: "false",

        IPPANEL_BASE_URL: "https://edge.ippanel.com/v1",
        IPPANEL_PATTERN_BASE_URL: "https://edge.ippanel.com/v1",
        IPPANEL_API_KEY: "YTA4YjNjYmQtZmU2OS00YWUwLWJlYzEtZGIyMzRkNWEyNDViOTFjYjk0NjE4YTI0YjkxZjg0N2M5ZDliYjMzNzZiZDI=",
        IPPANEL_FROM_NUMBER: "+983000505",
        IPPANEL_OTP_PATTERN_CODE: "2tc60",
        IPPANEL_REGISTER_EVENT_PATTERN_CODE: "kc0p2",

        SMTP_HOST: "",
        SMTP_PORT: "587",
        SMTP_USER: "",
        SMTP_PASS: "",
        SMTP_FROM: "Think Then Talk <no-reply@thinkthentalk.ir>",
      },
    },
  ],
};
