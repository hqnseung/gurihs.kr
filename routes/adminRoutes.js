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

// API
// @desc Get Team's players
router.get('/teams/:teamId/players', async (req, res) => res.json(await Player.find({ team: req.params.teamId })));
  
router.get('/api/statistics', (req, res) => {
  fs.readFile("../api.json", 'utf8', (err, data) => {
    if (err) {
        console.error('파일 읽기 중 오류 발생:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        res.json(jsonData)
    } catch (parseError) {
        console.error('JSON 파싱 중 오류 발생:', parseError);
    }
  });
});
module.exports = router