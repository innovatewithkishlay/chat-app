import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Initialize Redis Client
// Uses REDIS_URL from .env if available, otherwise defaults to localhost
const redisOptions = {
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3, // Fail fast if Redis is down
};

if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith("rediss://")) {
    // START TLS configuration
    redisOptions.tls = {
        rejectUnauthorized: false
    };
}

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", redisOptions);

redis.on("connect", () => console.log("✅ Redis Connected"));
redis.on("error", (err) => console.error("❌ Redis Connection Error:", err.message));

// Safe Wrapper to prevent app crash if Redis is down
// If Redis operation fails, we return null or false, letting the app fallback to DB
const safeRedis = async (operation, fallbackValue = null) => {
    try {
        return await operation();
    } catch (error) {
        console.error("Redis Operation Failed:", error.message);
        return fallbackValue;
    }
};

export const redisClient = {
    // Get Value
    get: async (key) => {
        return safeRedis(() => redis.get(key));
    },

    // Set Value with optional TTL (seconds)
    set: async (key, value, ttl = null) => {
        return safeRedis(async () => {
            if (ttl) {
                return redis.set(key, value, "EX", ttl);
            }
            return redis.set(key, value);
        });
    },

    // Delete Key
    del: async (key) => {
        return safeRedis(() => redis.del(key));
    },

    // Increment Counter
    incr: async (key) => {
        return safeRedis(() => redis.incr(key), 0);
    },

    // Add to Set
    sadd: async (key, value) => {
        return safeRedis(() => redis.sadd(key, value), 0);
    },

    // Check if Member exists in Set
    sismember: async (key, value) => {
        return safeRedis(async () => {
            const result = await redis.sismember(key, value);
            return result === 1;
        }, false);
    },

    // Set Expiry
    expire: async (key, seconds) => {
        return safeRedis(() => redis.expire(key, seconds));
    }
};

export default redis; // Export raw client if needed elsewhere
