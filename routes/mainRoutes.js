const express = require("express")
const checkIsApp = require("../middlewares/checkApp")
const { getMainPage, getBoardPage, getPostPage } = require("../controllers/mainController");
const renderTemplate = require("../utils/renderTemplate");
const router = express.Router()

// @desc View Website Main Page
router.get('/', (req, res) => renderTemplate(res, req, "index.ejs"));

// @desc View App Main page
router.route("/main")
  .get(checkIsApp, getMainPage)

// @desc View App Board Page
router.route("/board")
  .get(checkIsApp, getBoardPage)
router.route("/board/:id")
  .get(checkIsApp, getPostPage)

module.exports = router