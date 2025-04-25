require("dotenv").config();
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    logger.warn("Access Attempt without valid token");
    return res.status(404).json({
      success: false,
      message: "Authentication Required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      logger.warn("Invalid token!");
      return res.status(404).json({
        success: false,
        message: "Invalid Token!",
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { validateToken };
