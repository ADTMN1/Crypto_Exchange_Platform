import { Redis as UpstashRedis } from "@upstash/redis";

// ------------------------------
// Check required environment variables
// ------------------------------
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!upstashUrl || !upstashToken) {
  const missing = [];
  if (!upstashUrl) missing.push("UPSTASH_REDIS_REST_URL");
  if (!upstashToken) missing.push("UPSTASH_REDIS_REST_TOKEN");
  
  throw new Error(
    `❌ Redis initialization failed: Missing required environment variables: ${missing.join(", ")}`
  );
}

// ------------------------------
// Initialize Upstash Redis client
// ------------------------------
console.log("🚀 Initializing Upstash Redis client...");

const client = new UpstashRedis({
  url: upstashUrl,
  token: upstashToken,
});

// ------------------------------
// Create adapter with consistent method names
// ------------------------------
const redisClient = {
  setEx: async (key, ttl, value) => {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return await client.set(key, serialized, { ex: ttl });
  },
  get: async (key) => {
    const result = await client.get(key);
    // If result is already an object (Upstash auto-parsed it), return it as-is
    // If it's a string, try to parse it as JSON, if fails, return as string
    if (typeof result === 'object' && result !== null) {
      return result;
    }
    if (typeof result === 'string') {
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    }
    return result;
  },
  del: async (key) => await client.del(key),
  ping: async () => await client.ping(),
};

// ------------------------------
// Health check function
// ------------------------------
export const checkRedisHealth = async () => {
  try {
    await redisClient.ping();
    console.log("✅ Upstash Redis connection successful");
    return true;
  } catch (error) {
    console.error("❌ Upstash Redis connection failed:", error);
    return false;
  }
};

// ------------------------------
// Run health check on startup
// ------------------------------
checkRedisHealth();

// ------------------------------
// Run startup test
// ------------------------------
(async () => {
  try {
    await redisClient.setEx("test:key", 60, "working");
    const testValue = await redisClient.get("test:key");
    console.log("Redis test:", testValue);
    await redisClient.del("test:key");
  } catch (error) {
    console.error("Redis startup test failed:", error);
  }
})();

export default redisClient;
