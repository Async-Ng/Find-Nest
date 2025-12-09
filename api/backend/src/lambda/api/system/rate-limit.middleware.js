import { checkRateLimit } from "./system.service.js";

// US-055: Rate limiting middleware
export const rateLimitMiddleware = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const endpoint = req.route?.path || req.path;
    
    const result = checkRateLimit(userId, endpoint, maxRequests, windowMs);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime ? new Date(result.resetTime).toISOString() : undefined
    });
    
    if (!result.allowed) {
      return res.status(429).json({
        error: "TooManyRequests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    next();
  };
};