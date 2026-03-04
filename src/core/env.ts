export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Email configuration
  emailHost: process.env.EMAIL_HOST ?? "smtp.gmail.com",
  emailPort: process.env.EMAIL_PORT ?? "587",
  emailSecure: process.env.EMAIL_SECURE ?? "false",
  emailUser: process.env.EMAIL_USER ?? "",
  emailPassword: process.env.EMAIL_PASSWORD ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@centrika.rw",
  appUrl: process.env.APP_URL ?? "http://localhost:5175",
  // Redis configuration
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: process.env.REDIS_PORT ?? "6379",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  // Twilio configuration (optional for SMS)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
};
