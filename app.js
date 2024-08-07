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
  const allTeams = await Team.find();
  const allMatches = (await Match.find().populate('team1').populate('team2')).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  renderTemplate(res, req, "gugocup.ejs", { user: req.user, todaySchedule, matches, allTeams, allMatches });
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
