// High-Performance In-Memory & SessionStorage Cache
// Reduces page load times to 0ms on tab switches and prevents duplicate network waterfalls

const memoryCache = new Map();

export const getCached = (key, ttlMs = 180000) => {
  // 1. Check in-memory cache
  const item = memoryCache.get(key);
  if (item && Date.now() - item.time < ttlMs) {
    return item.data;
  }

  // 2. Check sessionStorage
  try {
    const raw = sessionStorage.getItem(`salesiq_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.time < ttlMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {
    // SessionStorage unavailable/error
  }

  return null;
};

export const setCached = (key, data) => {
  const payload = { data, time: Date.now() };
  memoryCache.set(key, payload);
  try {
    sessionStorage.setItem(`salesiq_${key}`, JSON.stringify(payload));
  } catch (e) {
    // SessionStorage full or blocked
  }
};

export const clearCacheKey = (key) => {
  memoryCache.delete(key);
  try {
    sessionStorage.removeItem(`salesiq_${key}`);
  } catch (e) {}
};

export const clearAllCache = () => {
  memoryCache.clear();
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('salesiq_'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch (e) {}
};
