const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: {
    error: 'Too many login attempts, please try again after 5 minutes'
  }
});

