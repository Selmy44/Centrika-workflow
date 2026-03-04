import { createClient, RedisClientType } from "redis";
import { ENV } from "./env";

let redisClient: RedisClientType | null = null;
let redisAvailable = false;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisAvailable && redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (!redisAvailable) {
    console.warn("[Redis] Redis caching disabled - using database-only OTP storage");
    return null;
  }

  try {
    redisClient = createClient({
      host: ENV.redisHost || "localhost",
      port: parseInt(ENV.redisPort || "6379"),
      password: ENV.redisPassword || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn("[Redis] Failed to reconnect after 3 attempts");
            redisAvailable = false;
            return false;
          }
          return 100 * retries;
        },
      },
    });

    redisClient.on("error", (err) => {
      console.warn("[Redis] Error:", err.message);
      redisAvailable = false;
    });

    await redisClient.connect();
    redisAvailable = true;
    console.log("[Redis] Connected successfully");
    return redisClient;
  } catch (err) {
    console.warn("[Redis] Connection failed:", err instanceof Error ? err.message : err);
    redisAvailable = false;
    return null;
  }
}

export async function setOtpInRedis(
  userId: number,
  code: string,
  expirySeconds: number = 600
): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) return false; // Graceful fallback

    const key = `otp:${userId}`;
    await redis.setEx(key, expirySeconds, code);
    return true;
  } catch (error) {
    console.warn("[Redis OTP] Set failed:", error);
    return false;
  }
}

export async function getOtpFromRedis(userId: number): Promise<string | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;

    const key = `otp:${userId}`;
    return await redis.get(key);
  } catch (error) {
    console.warn("[Redis OTP] Get failed:", error);
    return null;
  }
}

export async function deleteOtpFromRedis(userId: number): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) return true; // Don't block if Redis unavailable

    const key = `otp:${userId}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn("[Redis OTP] Delete failed:", error);
    return true; // Don't fail the flow
  }
}

export async function setMfaSessionInRedis(
  sessionToken: string,
  userId: number,
  expirySeconds: number = 1800
): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) return false;

    const key = `mfa_session:${sessionToken}`;
    await redis.setEx(key, expirySeconds, JSON.stringify({ userId }));
    return true;
  } catch (error) {
    console.warn("[Redis MFA Session] Set failed:", error);
    return false;
  }
}

export async function getMfaSessionFromRedis(
  sessionToken: string
): Promise<{ userId: number } | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;

    const key = `mfa_session:${sessionToken}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("[Redis MFA Session] Get failed:", error);
    return null;
  }
}

export async function deleteMfaSessionFromRedis(sessionToken: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    if (!redis) return true;

    const key = `mfa_session:${sessionToken}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn("[Redis MFA Session] Delete failed:", error);
    return true;
  }
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch (err) {
      console.warn("[Redis] Error closing connection:", err);
    }
    redisClient = null;
  }
}

