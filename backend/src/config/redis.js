const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Redis in-memory se REDIS_URL assente (ok per avvio su Render senza Upstash; cache persa a ogni restart).
 * In produzione conviene sempre REDIS_URL (es. Upstash rediss://…).
 */
function createMemoryRedis() {
  const store = new Map();
  return {
    get: async (k) => (store.has(k) ? store.get(k) : null),
    setex: async (k, _ttl, v) => {
      store.set(k, String(v));
      return 'OK';
    },
    keys: async (pattern) => {
      const star = pattern.indexOf('*');
      if (star === -1) return store.has(pattern) ? [pattern] : [];
      const prefix = pattern.slice(0, star);
      return [...store.keys()].filter((key) => key.startsWith(prefix));
    },
    del: async (...keyList) => {
      let n = 0;
      for (const k of keyList) if (store.delete(k)) n += 1;
      return n;
    },
    on() {},
  };
}

const url = process.env.REDIS_URL && String(process.env.REDIS_URL).trim();

let redis;
if (url) {
  redis = new Redis(url, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
  });
  redis.on('connect', () => logger.info('✅ Redis connected'));
  redis.on('error', (err) => logger.error('Redis error:', err));
} else {
  logger.warn(
    'REDIS_URL non impostato: uso cache slot in-memory (si perde al riavvio). Su Render aggiungi Redis (es. Upstash) e REDIS_URL.'
  );
  redis = createMemoryRedis();
}

module.exports = redis;
