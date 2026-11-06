export const ENV = {
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.COOKIE_SECRET ?? process.env.JWT_SECRET ?? "",
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
  emailFrom: process.env.EMAIL_FROM ?? "no-reply@centrika.rw",
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  // Redis configuration
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: process.env.REDIS_PORT ?? "6379",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  // Twilio configuration (optional for SMS)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
};

// Startup validation — warn about missing critical config
if (!ENV.cookieSecret) {
  console.warn("⚠️  WARNING: JWT_SECRET is not set! Sessions will not work. Set JWT_SECRET in .env");
}
if (!ENV.databaseUrl) {
  console.warn("⚠️  WARNING: DATABASE_URL is not set! Database will not connect. Set DATABASE_URL in .env");
}
if (!process.env.FRONTEND_URL) {
  console.warn("⚠️  WARNING: FRONTEND_URL is not set! CORS defaults to http://localhost:5173. Set FRONTEND_URL in .env");
}

/**
 * Helper to dynamically determine the frontend URL based on the incoming request.
 * Prioritizes the Request's Origin or Referer header, falling back to the configured APP_URL or FRONTEND_URL.
 */
export function getFrontendUrl(req?: any): string {
  if (req && req.headers) {
    // 1. Try Origin header
    const origin = req.headers.origin;
    if (origin && typeof origin === "string") {
      return origin.replace(/\/$/, "");
    }
    
    // 2. Try Referer header (parse base origin)
    const referer = req.headers.referer;
    if (referer && typeof referer === "string") {
      try {
        const url = new URL(referer);
        return url.origin;
      } catch (e) {
        // Ignore parsing error
      }
    }
  }

  // 3. Fallback to env configured APP_URL or FRONTEND_URL
  const configuredUrl = process.env.APP_URL || process.env.FRONTEND_URL || process.env.VITE_OAUTH_PORTAL_URL;
  if (configuredUrl) {
    // Take the first origin in case of comma-separated values (like FRONTEND_URL)
    return configuredUrl.split(",")[0].trim().replace(/\/$/, "");
  }

  // 4. Default fallback
  return "http://localhost:5173";
}
