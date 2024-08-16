require('dotenv').config();
const fs = require("node:fs");
const express = require("express");
const expressSanitizer = require("express-sanitizer");
const session = require('express-session');
const fileStore = require('session-file-store')(session);
const path = require("path");
const ejs = require("ejs");
const https = require("https");
const bodyParser = require('body-parser');
const { default: axios } = require("axios");
const mongoose = require('mongoose');
const passport = require('passport');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');

const User = require("./models/User");
const Post = require("./models/Post");

const DATABASE_URL = process.env.DATABASE_URL
const sessionSecret = process.env.sessionSecret
const startType = process.env.startType
const marketSecret = process.env.marketSecret
const Log = require("./models/Log");
const Schedule = require('./models/Schedules');
const Match = require('./models/Match');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Standing = require('./models/standing');
mongoose.set('strictPopulate', false);

const app = express();
const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

mongoose.connect(DATABASE_URL)
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('DB connection error:', err));

app.engine("html", ejs.renderFile);
app.set("view engine", "html");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(express.static(path.resolve(`${dataDir}${path.sep}assets`)));

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2628000000 },
  store: new fileStore(),
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENTID_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URIS,
}, async (accessToken, refreshToken, profile, done) => {
  const user = {
    provider: profile.provider,
    providerId: profile.id,
    token: accessToken,
    name: profile.displayName,
    email: profile.emails[0].value,
    picture: profile.photos[0].value,
  };
  done(null, user);
}));

const renderTemplate = (res, req, template, data = {}) => {
  res.render(path.resolve(`${templateDir}${path.sep}${template}`), { ...data });
};

const fullPattern = /^\d{2}_stu\d{4}@guri\.hs\.kr$/;
const domainPattern = /@guri\.hs\.kr$/;

app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    const email = req.user.email;

    if (fullPattern.test(email)) {
      const id = email.split('@')[0];
      const name = req.user.name.replace(/\d+/g, '');
      if (!(await User.findOne({ id }))) {
        await User.create({ id, name, point: 0 });
      }
      res.redirect('/main');

    } else if (domainPattern.test(email)) {
      const id = email.split('@')[0];
      const name = req.user.name.replace(/\d+/g, '');
      if (!(await User.findOne({ id }))) {
        await User.create({ id, name, point: 0, role: "teacher" });
      }
      res.redirect('/main');

    } else {
      req.logout(err => {
        if (err) return next(err);
        renderTemplate(res, req, "login.ejs", { status: "fail" });
      });
    }
  }
);
  
app.get('/', (req, res) => renderTemplate(res, req, "index.ejs"));

app.get('/login', (req, res) => {
  req.user ? res.redirect('/main') : renderTemplate(res, req, "login.ejs", { status: "ok" });
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatDateForDisplay(date) {
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();
  return `${month}월 ${day}일`;
}

app.get('/main', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = req.user

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530054&KEY=6b2c5a8bd8284662bf5be43ffb875dc4&MLSV_YMD=${date}`;
  
  let currentDate = new Date();
  
  const fetchLunchInfo = async () => {
    let lunch = "오늘의 급식정보가 존재하지 않습니다.";
    let attempts = 0;
    let foundDate = formatDateForDisplay(currentDate);
  
    while (attempts < 4) {
      try {
        const urlWithDate = url.replace(date, formatDate(currentDate));
        const response = await axios.get(urlWithDate);
        if (response.data.RESULT && response.data.RESULT.CODE === "INFO-200") {
          attempts++;
          currentDate.setDate(currentDate.getDate() + 1);
          foundDate = formatDateForDisplay(currentDate); 
        } else {
          const data = response.data;
          const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
          lunch = ddishNm;
          foundDate = formatDateForDisplay(currentDate);
          break;
        }
      } catch (error) {
          console.error("Error fetching the lunch menu:", error);
          break;
      }
    }
  
    renderTemplate(res, req, "main.ejs", { user, lunch, date: foundDate });
  };
  
  fetchLunchInfo();
});

app.get('/point', async (req, res) => {
  if (!req.user) return res.redirect('/login');

  const userId = req.user.email.split('@')[0];
  const user = await User.findOne({ id: userId });

  renderTemplate(res, req, "point.ejs", { point: user.point.toLocaleString(), user: req.user });
});

app.post('/point', async (req, res) => {
  if (!req.user) return res.status(400).json({ message: 'Error occurred while processing data' });

  const userId = req.user.email.split('@')[0];
  const { points, adminPassword } = req.body;

  if (adminPassword !== marketSecret || points < 0) {
    return res.status(400).json({ message: 'Error occurred while processing data' });
  }

  const user = await User.findOne({ id: userId });
  if (user.point - points < 0) {
    return res.status(400).json({ message: 'Error occurred while processing data' });
  }

  user.point -= points;
  await user.save();
  const log = new Log({
    userId: user.id,
    userName: user.name,
    point: -points,
    reason: "구리고등학교 매점"
  })
  await log.save()
  console.log(`Gugopoint 결제완료: ${user.id}(${user.name}) "${-points}" - "구리고등학교 매점"`)

  res.json({ message: 'Data received successfully' });
});

app.get('/post', async (req, res) => {
  if (!req.user) return res.redirect('/login'); 

  const userId = req.user.email.split('@')[0];
  const user = await User.findOne({ id: userId });

  if (user.role !== "admin") return renderTemplate(res, req, "403.ejs")

  renderTemplate(res, req, "post.ejs", { user: req.user });
});

app.post('/post', async (req, res) => {
  if (!req.user) return res.status(400).json({ message: 'Error occurred while processing data' });

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
});

app.get('/matches/new', async (req, res) => {
  if (!req.user) return res.redirect('/login'); 

  const userId = req.user.email.split('@')[0];
  const user = await User.findOne({ id: userId });

  if (user.role !== "admin") return renderTemplate(res, req, "403.ejs")

  const teams = await Team.find();
  renderTemplate(res, req, "matchPost.ejs", { teams });
});

app.post('/matches', async (req, res) => {
  if (!req.user) return res.status(400).json({ message: 'Error occurred while processing data' });
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

    team1Standing.points = team1Standing.wins * 3 + team1Standing.draws;
    team2Standing.points = team2Standing.wins * 3 + team2Standing.draws;

    await Promise.all([
        team1Standing.save(),
        team2Standing.save()
    ]);

    for (const event of events) {
        const { minute, team, player, eventType, assistsPlayer } = event;
        const playerDoc = await Player.findOne({ team, name: player });
        const assistsPlayerDoc = await Player.findOne({ team, name: assistsPlayer });

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
        if (assistsPlayerDoc) {
          assistsPlayerDoc.assists += 1;
          await assistsPlayerDoc.save();
        }
    }

    res.redirect('/gugocup');
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/teams/:teamId/players', async (req, res) => {
  try {
      const players = await Player.find({ team: req.params.teamId });
      res.json(players);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

async function updateStandings(team1Standing, team2Standing, scoreTeam1, scoreTeam2) {
  team1Standing.played += 1;
  team2Standing.played += 1;

  team1Standing.goalsFor += scoreTeam1;
  team1Standing.goalsAgainst += scoreTeam2;
  team2Standing.goalsFor += scoreTeam2;
  team2Standing.goalsAgainst += scoreTeam1;

  if (scoreTeam1 > scoreTeam2) {
      team1Standing.wins += 1;
      team1Standing.points += 3;
      team2Standing.losses += 1;
  } else if (scoreTeam1 < scoreTeam2) {
      team2Standing.wins += 1;
      team2Standing.points += 3;
      team1Standing.losses += 1;
  } else {
      team1Standing.draws += 1;
      team2Standing.draws += 1;
      team1Standing.points += 1;
      team2Standing.points += 1;
  }

  await team1Standing.save();
  await team2Standing.save();
}

async function updatePlayerStats(events) {
  for (const event of events) {
      const player = await Player.findOne({ name: event.player, team: event.team });
      if (!player) continue;

      switch (event.eventType) {
          case 'goal':
              player.goals += 1;
              break;
          case 'yellow card':
              player.yellowCards += 1;
              break;
          case 'red card':
              player.redCards += 1;
              break;
      }

      await player.save();
  }
}

app.get('/gugocup', async (req, res) => {
  if (!req.user) return res.redirect('/login'); 

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
  
  renderTemplate(res, req, "gugocup.ejs", { user: req.user, todaySchedule, matches, allTeams, allMatches, allPlayers, groupedStandings });
});

app.get('/gugocup/team', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const id = req.query.id

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

    renderTemplate(res, req, "team.ejs", { team, standing, user: req.user, rank, matches, players });
  } else {
    const allTeam = await Team.find()
    renderTemplate(res, req, "allTeam.ejs", { user: req.user, allTeam });
  }
});

// app.get('/gugocup/team/:name', async (req, res) => {
//   const name = req.params.name;
//   const matches = name.match(/^([^-\s]+)-([^-\s]+)$/);

// if (matches) {
//     const part1 = matches[1];
//     const part2 = matches[2];
//     const team = await Team.findOne({ grade: part1, class: part2 })
//     if (team) {
//       res.redirect(`/gugocup/team?id=${team._id}`)
//     } else {
//       res.redirect("/gugocup/team")
//     }
// } else {
//     res.redirect("/gugocup/team")
// }
// });

app.get('/gugocup/player', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const id = req.query.id

  if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Player.findById(id)) {
    const player = await Player.findById(id).populate('team')

    renderTemplate(res, req, "player.ejs", { player, user: req.user });
  } else {
    const allPlayer = await Player.find().sort({ goals: -1 }).populate('team')
    renderTemplate(res, req, "allPlayer.ejs", { user: req.user, allPlayer });
  }
});

app.get('/gugocup/match', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const id = req.query.id

  if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Match.findById(id)) {
    const match = await Match.findById(id).populate('team1').populate('team2');

    renderTemplate(res, req, "match.ejs", { match, user: req.user });
  } else {
    const allMatches = (await Match.find().populate('team1').populate('team2')).sort((a, b) => new Date(b.date) - new Date(a.date));
    renderTemplate(res, req, "allMatch.ejs", { user: req.user, allMatches });
  }
});

app.get('/gugocup/schedule', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const id = req.query.id

  if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Schedule.findById(id)) {
    const schedule = await Schedule.findById(id);
    renderTemplate(res, req, "schedule.ejs", { schedule, user: req.user });
  } else {
    const today = new Date();
    const allSchedule = await Schedule.find({ date: { $gte: today } }) .populate('team1').populate('team2').sort({ date: +1 }).exec();
    renderTemplate(res, req, "allSchedule.ejs", { user: req.user, allSchedule });
  }
});

app.get('/board', async (req, res) => {                               
  if (!req.user) return res.redirect('/login');                     
  const id = req.query.id                                         
                                                              
  if (id && id.match(/^[0-9a-fA-F]{24}$/) && await Post.findById(id)) {
    const post = await Post.findById(id);
    renderTemplate(res, req, "view.ejs", { post, user: req.user });
  } else {
    const postList = await Post.find();
    renderTemplate(res, req, "board.ejs", { user: req.user, postList });
  }
});

app.get('/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.send(err);
});

app.use((req, res, next) => res.status(404).render(path.resolve(`${templateDir}${path.sep}404.ejs`)));

const startServer = () => {
  if (startType === "https") {
    const options = {
      key: fs.readFileSync("./config/private.key"),
      cert: fs.readFileSync("./config/certificate.crt"),
    };
    https.createServer(options, app).listen(443, () => {
      console.log(`HTTPS server started on port 443`);
    });
  } else if (startType === "http") {
    app.listen(3000, () => {
      console.log(`HTTP server started on port 3000`);
    });
  }
};

require("./src/cron")

process.on('uncaughtException', (error) => {
  console.error(`[ uncaughtException ] : ${error.message}`);
});

startServer();
