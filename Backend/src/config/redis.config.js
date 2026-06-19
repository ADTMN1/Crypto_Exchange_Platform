import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

// 1. Strict Environment Variable Validation (Fail-Fast)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  const missing = [];
  if (!redisUrl) missing.push("UPSTASH_REDIS_REST_URL");
  if (!redisToken) missing.push("UPSTASH_REDIS_REST_TOKEN");
  
  throw new Error(
    `❌ Redis Initialization Failed: Missing environment variable(s): ${missing.join(", ")}. ` +
    `Ensure your .env file is loaded correctly.`
  );
}

// 2. Safe Instance Instantiation
let redisClient;

try {
  redisClient = new Redis({
    url: redisUrl,
    token: redisToken,
  });
} catch (error) {
  throw new Error(`❌ Failed to instantiate Upstash Redis client: ${error.message}`);
}

// 3. Proactive Runtime Connectivity Check (Asynchronous Health Check)
export const checkRedisHealth = async () => {
  try {
    const pingResponse = await redisClient.ping();
    if (pingResponse === "PONG") {
      return true;
    }
    console.warn(`⚠️ Redis health check returned unexpected response: ${pingResponse}`);
    return false;
  } catch (error) {
    console.error("❌ Redis health check failed:", error);
    return false;
  }
};

// Auto-run health check in development environments to catch misconfigurations instantly
if (process.env.NODE_ENV !== "production") {
  checkRedisHealth().then((isHealthy) => {
    if (isHealthy) {
      console.log("🚀 Upstash Redis connected and authenticated successfully.");
    }
  });
}

export default redisClient;