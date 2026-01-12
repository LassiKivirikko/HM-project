const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController")
const authMiddleware = require("../middleware/authMiddleware").authMiddleware;
const loginLimiter = require("../middleware/rateLimit").loginLimiter;

router.post('/login', loginLimiter, userController.userLogin);
router.post('/change_password', authMiddleware, userController.changePassword);

router.get("/user", authMiddleware, userController.getUserInfo);

router.post("/refresh", userController.getRefreshToken);
router.post("/logout", userController.userLogout);

module.exports = router;