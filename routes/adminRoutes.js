const express = require("express")
const checkAdmin = require("../middlewares/checkAdmin");
const { addPostForm, createPost, addMatchForm, createMatch, createSchedule, addScheduleForm } = require("../controllers/adminController");
const Player = require("../models/Player");
const router = express.Router()

// @desc Create New Post
router.route("/post")
  .get(checkAdmin, addPostForm)
  .post(checkAdmin, createPost)

// @desc Create New Match
router.route("/matches/new")
  .get(checkAdmin, addMatchForm)
router.route("/matches")
  .post(checkAdmin, createMatch)

// @desc Create New Schedule
router.route("/schedule/new")
  .get(checkAdmin, addScheduleForm)
router.route("/schedule")
  .post(checkAdmin, createSchedule)

// @desc Get Team's players
router.get('/teams/:teamId/players', async (req, res) => res.json(await Player.find({ team: req.params.teamId })));
  
module.exports = router