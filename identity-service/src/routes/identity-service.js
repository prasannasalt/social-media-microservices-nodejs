const express = require("express");
const router = express.Router();
const userController = require("../controllers/identity-controller");

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.post("/refresh-token", userController.refreshTokenUser);

router.post("/logout", userController.logoutUser);

module.exports = router;
