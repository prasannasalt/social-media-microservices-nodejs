const logger = require("../utils/logger");
const User = require("../models/User");
const { validateRegistration, validateLogin } = require("../utils/validation");
const generateTokens = require("../utils/generateToken");
const RefreshToken = require("../models/refreshToken");

// Register User
const registerUser = async (req, res) => {
  logger.info("Registation End Point");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      console.log("This Is Error", error);
      logger.warn("Validate Error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User Alredy Exists");
      return res.status(400).json({
        success: false,
        message: "User Alredy Exists",
      });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.warn("User Saved Successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Register Error Occure", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Login User Controller
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      console.log("This Is Error", error);
      logger.warn("Validate Error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid User");
      res.status(400).json({
        success: false,
        message: `Invalid credentials`,
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      logger.warn("Invalid Password");
      res.status(400).json({
        success: false,
        message: `Invalid credentials`,
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(200).json({
      userId: user._id,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Login Error Occure", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Refresh token controller
const refreshTokenUser = async (req, res) => {
  logger.info("Refresh Token endpoint hit...");
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn("Refresh Token Missing...");
      res.status(400).json({
        success: false,
        message: `Refresh Token Missing...`,
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or Expired refresh token");
      res.status(401).json({
        success: false,
        message: `Invalid or Expired refresh token`,
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      logger.warn("User not found");
      res.status(401).json({
        success: false,
        message: `User not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    // Delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh Token Error Occure", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Logout user Controller
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh Token Missing...");
      res.status(400).json({
        success: false,
        message: `Refresh Token Missing...`,
      });
    }

    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted for logout");

    res.status(200).json({
      success: true,
      message: `Logged out successfully`,
    });
  } catch (error) {
    logger.error("Logout Error Occure", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };
