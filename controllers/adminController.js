const Match = require("../models/Match");
const Player = require("../models/Player");
const Post = require("../models/Post");
const Schedule = require("../models/Schedules");
const Team = require("../models/Team");
const renderTemplate = require("../utils/renderTemplate");

// @desc View New Post form
// @route GET /post
const addPostForm = async (req, res) => {
    renderTemplate(res, req, "post.ejs", { user: req.user });                                
}

// @desc Create New Post
// @route POST /post
const createPost = async (req, res) => {
    const { title, content, mainPicture } = req.body;

    const newPost = new Post({
      author: req.user.name.replace(/\d+/g, ''),
      title,
      content,
      mainPicture,
      view: 0
    });
  
    try {
        await newPost.save();
        res.redirect("/board")
    } catch (error) {
        console.error(error);
        res.status(500).send('글 작성 중 오류가 발생했습니다.');
    }                                 
}

// @desc View New Match form
// @route GET /matches/new
const addMatchForm = async (req, res) => {
    const teams = await Team.find();
    renderTemplate(res, req, "matchPost.ejs", { teams });                           
}

// @desc Create New Match
// @route POST /matches
const createMatch = async (req, res) => {
    try {
        const { date, team1, team2, score1, score2, events } = req.body;
    
        const scoreTeam1 = parseInt(score1, 10);
        const scoreTeam2 = parseInt(score2, 10);
    
        if (isNaN(scoreTeam1) || isNaN(scoreTeam2)) {
            return res.status(400).send('Invalid score values');
        }
    
        const match = new Match({
            date,
            team1,
            team2,
            score: { team1: scoreTeam1, team2: scoreTeam2 },
            events
        });
    
        await match.save();
    
        const [team1Standing, team2Standing] = await Promise.all([
            Standing.findOne({ team: team1 }),
            Standing.findOne({ team: team2 })
        ]);
    
        if (!team1Standing || !team2Standing) {
            return res.status(404).send('One or both teams not found in standings');
        }
    
        if (scoreTeam1 > scoreTeam2) {
            team1Standing.wins += 1;
            team2Standing.losses += 1;
        } else if (scoreTeam1 < scoreTeam2) {
            team1Standing.losses += 1;
            team2Standing.wins += 1;
        } else {
            team1Standing.draws += 1;
            team2Standing.draws += 1;
        }
    
        team1Standing.played += 1;
        team2Standing.played += 1;
        team1Standing.goalsFor += scoreTeam1;
        team1Standing.goalsAgainst += scoreTeam2;
        team2Standing.goalsFor += scoreTeam2;
        team2Standing.goalsAgainst += scoreTeam1;
    
        // 예선 끝나서 주석해둠
        // team1Standing.points = team1Standing.wins * 3 + team1Standing.draws;
        // team2Standing.points = team2Standing.wins * 3 + team2Standing.draws;
    
        await Promise.all([
            team1Standing.save(),
            team2Standing.save()
        ]);
    
        for (const event of events) {
            const { minute, team, player, eventType, assistsPlayer } = event;
            const playerDoc = await Player.findOne({ team, name: player });
    
            if (playerDoc) {
                if (eventType === 'goal') {
                    playerDoc.goals += 1;
                } else if (eventType === 'yellow card') {
                    playerDoc.yellowCards += 1;
                } else if (eventType === 'red card') {
                    playerDoc.redCards += 1;
                }
                await playerDoc.save();
            }
        }
      } catch (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
      }                                 
}

// @desc View New Schedule form
// @route GET /schedule/new
const addScheduleForm = async (req, res) => {
    const teams = await Team.find(); 
    renderTemplate(res, req, "schedulePost.ejs", { teams });                        
}

// @desc Create New Schedule
// @route POST /schedule
const createSchedule = async (req, res) => {
    try {
        const { date, team1, team2 } = req.body;
    
        const schedule = new Schedule({
          date,
          team1,
          team2
        });
    
        await schedule.save();
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }                          
}

module.exports = { addPostForm, createPost, addMatchForm, createMatch, addScheduleForm, createSchedule }