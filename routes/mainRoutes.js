const express = require("express")
const checkIsApp = require("../middlewares/checkApp")
const { getMainPage, getBoardPage, getPostPage } = require("../controllers/mainController")
const router = express.Router()

// @desc View App Main page
router.route("/main")
  .get(checkIsApp, getMainPage)

// @desc View App Board Page
router.route("/board")
  .get(checkIsApp, getBoardPage)
router.route("/board/:id")
  .get(checkIsApp, getPostPage)
