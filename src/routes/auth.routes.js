const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validation.middleware");
const { registerSchema, loginSchema } = require("../middleware/schemas");
const { authLimiter } = require("../middleware/rateLimiter.middleware");

const router = express.Router();

// Apply auth rate limiting globally to all authentication routes
router.use(authLimiter);

// POST /api/auth/register
router.post("/register", validate(registerSchema), authController.userRegisterController);

// POST /api/auth/login
router.post("/login", validate(loginSchema), authController.userLoginController);

// POST /api/auth/refresh
router.post("/refresh", authController.userRefreshController);

// POST /api/auth/logout
router.post("/logout", authController.userLogoutController);

module.exports = router;