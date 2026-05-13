function createRateLimiter({
  max = 10,
  message = "Too many requests. Please try again shortly.",
  windowMs = 15 * 60 * 1000
} = {}) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const currentBucket = buckets.get(key);

    if (!currentBucket || currentBucket.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs
      });
      return next();
    }

    if (currentBucket.count >= max) {
      return res.status(429).json({ message });
    }

    currentBucket.count += 1;
    return next();
  };
}

module.exports = {
  createRateLimiter
};
