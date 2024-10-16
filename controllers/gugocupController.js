const Standing = require("../models/standing");
const Team = require("../models/Team");
const Match = require("../models/Match");
const Player = require("../models/Player");
const renderTemplate = require("../utils/renderTemplate");
const Schedule = require("../models/Schedules");

// @desc View main gugocup page
// @route GET /gugocup
    const getGugocup_MainPage = async (req, res) => {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    let todaySchedule;
    
    Schedule.find({
        date: {
            $gte: startOfDay,
            $lt: endOfDay 
        }
    })
    .populate('team1')
    .populate('team2')
    .then(schedules => {
        todaySchedule = schedules;
    })
    
    const matches = await Match.find();
    const allTeams = await Team.find().populate('standing');
    
    const standings = await Standing.find()
    .populate('team')
    .exec();
    
    const groupedStandings = standings.reduce((acc, standing) => {
      const group = standing.team.group;
      if (!acc[group]) {
          acc[group] = [];
      }
      acc[group].push(standing);
      return acc;
    }, {});
    
    for (const group in groupedStandings) {
        groupedStandings[group].sort((a, b) => b.points - a.points);
    }
    
    const allPlayers = await Player.find().sort({ goals: -1 }).limit(5).populate('team');  
    const allMatches = (await Match.find().populate('team1').populate('team2')).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    
    renderTemplate(res, req, "gugocup.ejs", { todaySchedule, matches, allTeams, allMatches, allPlayers, groupedStandings });      
}

// @desc View All Teams
// @route GET /gugocup/team
const getGugocup_TeamsPage = async (req, res) => {
    const allTeam = await Team.find()
    renderTemplate(res, req, "allTeam.ejs", { allTeam });
}

// @desc Get Team
// @route GET /gugocup/team/:id
const getGugocup_TeamPage = async (req, res) => {
    const id = req.params.id
    if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Team.findById(id)) {
        const team = await Team.findById(id)
        const standing = await Standing.findOne({ team: id })

        const group = team.group;
        const teamIds = (await Team.find({ group }).select('_id')).map(t => t._id);
        const standings = await Standing.find({ team: { $in: teamIds } })
            .populate('team')
            .sort({ points: -1 })
            .exec();
        const rank = standings.findIndex(standing => standing.team._id.toString() === id) + 1;

        const matches = await Match.find({
            $or: [{ team1: id }, { team2: id }]
        })
        .populate('team1')
        .populate('team2')
        .exec();

        const players = await Player.find({ team: id });

        renderTemplate(res, req, "team.ejs", { team, standing, rank, matches, players });
    } else {
        res.redirect("/team")
    }
}

// @desc View All Players
// @route GET /gugocup/player
const getGugocup_PlayersPage = async (req, res) => {
    const allPlayer = await Player.find().sort({ goals: -1 }).populate('team')
    renderTemplate(res, req, "allPlayer.ejs", { allPlayer });
}

// @desc Get Player
// @route GET /gugocup/player/:id
const getGugocup_PlayerPage = async (req, res) => {
    const id = req.params.id
    // if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Player.findById(id)) {
        const player = await Player.findById(id).populate('team')
        renderTemplate(res, req, "player.ejs", { player });
    // } else {
    //     res.redirect("/player")
    // }
}

// @desc View All Matches
// @route GET /gugocup/match
const getGugocup_MatchesPage = async (req, res) => {
    const allMatches = (await Match.find().populate('team1').populate('team2')).sort((a, b) => new Date(b.date) - new Date(a.date));
    renderTemplate(res, req, "allMatch.ejs", { allMatches });
}

// @desc Get Match
// @route GET /gugocup/match/:id
const getGugocup_MatchPage = async (req, res) => {
    const id = req.params.id
    if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Match.findById(id)) {
        const match = await Match.findById(id).populate('team1').populate('team2');
        renderTemplate(res, req, "match.ejs", { match });
    } else {
        res.redirect("/match")
    }
}

// @desc View All Schedules
// @route GET /gugocup/schedule
const getGugocup_SchedulesPage = async (req, res) => {
    const today = new Date();
    const allSchedule = await Schedule.find({ date: { $gte: today } }) .populate('team1').populate('team2').sort({ date: +1 }).exec();
    renderTemplate(res, req, "allSchedule.ejs", { allSchedule });
}




module.exports = { getGugocup_MainPage, getGugocup_TeamsPage, getGugocup_TeamPage, getGugocup_PlayersPage, getGugocup_PlayerPage, getGugocup_MatchesPage, getGugocup_MatchPage, getGugocup_SchedulesPage }