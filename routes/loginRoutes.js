const express = require("express")
const passport = require('passport');
const { getLoginPage, googleCallback, getLogout } = require("../controllers/loginController");
const router = express.Router()

// @desc View Login Page
router.route("/login")
  .get(getLoginPage)

// @desc Logout
router.route("/auth/logout")
  .get(getLogout)

// @desc Authenticate with Google
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

// @desc Google OAuth Callback
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback
);

module.exports = router;
