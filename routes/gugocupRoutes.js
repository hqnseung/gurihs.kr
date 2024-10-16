const express = require("express")
const checkIsApp = require("../middlewares/checkApp")
const { getGugocup_MainPage, getGugocup_TeamsPage, getGugocup_TeamPage, getGugocup_PlayersPage, getGugocup_SchedulesPage, getGugocup_MatchesPage, getGugocup_PlayerPage, getGugocup_MatchPage } = require("../controllers/gugocupController")
const router = express.Router()

// @desc View main gugocup page
router.route("/")
  .get(checkIsApp, getGugocup_MainPage)

// @desc Get Team
router.route("/team")
  .get(checkIsApp, getGugocup_TeamsPage)
router.route("/team/:id")
  .get(checkIsApp, getGugocup_TeamPage)

// @desc Get Player
router.route("/player")
  .get(checkIsApp, getGugocup_PlayersPage)
router.route("/player/:id")
  .get(checkIsApp, getGugocup_PlayerPage)

// @desc Get Match
router.route("/match")
  .get(checkIsApp, getGugocup_MatchesPage)
router.route("/match/:id")
  .get(checkIsApp, getGugocup_MatchPage)

// @desc Get Schedule
router.route("/schedule") 
  .get(checkIsApp, getGugocup_SchedulesPage)

module.exports = router