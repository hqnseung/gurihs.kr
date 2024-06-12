const fs = require("node:fs")
const express = require("express");``
const expressSanitizer = require("express-sanitizer");
const session = require('express-session');
const fileStore = require('session-file-store')(session);
const app = express();
const passport = require('passport'), GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const path = require("path");
const ejs = require("ejs");
const https = require("https");
const bodyParser = require('body-parser');
const { default: axios } = require("axios");
const mongoose = require('mongoose');
const User = require("./models/User");
const { DATABASE_URL, googleCredentials, sessionSecret, startType } = require("./env");
const Post = require("./models/Post");

const dataDir = path.resolve(`${process.cwd()}${path.sep}`); 
const templateDir = path.resolve(`${dataDir}${path.sep}templates`); 

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));

app.engine("html", ejs.renderFile);
app.set("view engine", "html");

app.use(bodyParser.json());
app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)));
app.use(express.urlencoded({extended : true}));
app.use(expressSanitizer());
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge : 2628000000 },
    store : new fileStore()
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: googleCredentials.web.client_id,
  clientSecret: googleCredentials.web.client_secret,
  callbackURL: googleCredentials.web.redirect_uris[0]
},
function(accessToken, refreshToken, profile, done) {
  const user = {
      provider : profile.provider,
      providerId : profile.id,
      token : accessToken,
      name : profile.displayName,
      email : profile.emails[0].value,
      picture : profile.photos[0].value
  }
  console.log(`login | ${profile.displayName} / ${profile.emails[0].value}`)
  return done(null, user);
}
));

const renderTemplate = (res, req, template, data = {}) => {
  res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(data));
};

app.get('/auth/google', passport.authenticate('google', { scope: ['email','profile'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  async function(req, res) {
    const email = res.req.user.email

    function containsSpecificValue(email, specificValue) {
      const regex = new RegExp(specificValue, 'i'); 
      return regex.test(email);
    }

    if (containsSpecificValue(email, '@guri.hs.kr')) {
      res.redirect('/main');
      const atIndex = email.indexOf('@');
      const id = email.substring(0, atIndex);
      const name = res.req.user.name.replace(/\d+/g, '')

      const dataToWrite = {
        id: id,
        name: name,
        point: 0,
      }

      if (await User.find({ id: id })) return
      await User.create(dataToWrite)

    } else {
      req.logOut(err => {
        if (err) {
          return next(err);
        } else {
          renderTemplate(res, req, "login.ejs");
        }
      });
    }
  }
);

app.get('/', (req, res) => renderTemplate(res, req, "index.ejs"));

app.get('/login', (req, res) => {
  const user = req.user;
  if (user == undefined) {
    renderTemplate(res, req, "login.ejs");
  } else {
    res.redirect('/main');
  }
});

app.get('/main', (req, res) => {
  const user = req.user;
  if (user === undefined) return res.redirect('/login')

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const date = year + month + day;
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530054&KEY=6b2c5a8bd8284662bf5be43ffb875dc4&MLSV_YMD=${date}`;

  axios.get(url)
      .then(async response => {
        let lunch = "";
        if (response.data.RESULT && response.data.RESULT.CODE === "INFO-200") {
          lunch = "오늘의 급식정보가 존재하지 않습니다.";
        } else {
          const data = response.data;
          const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
          lunch = ddishNm;
        }
        renderTemplate(res, req, "main.ejs", { user, lunch });
      }).catch(error => {
        console.error("Error fetching the lunch menu:", error);
      });
});

app.get('/point', async (req, res) => {
  const user = req.user;

  if (user === undefined) return res.redirect('/login')

  const userEmail = user.email
  const userId = userEmail.substring(0, userEmail.indexOf('@'))
  const userdb = (await User.find({ id: userId }))[0]

  renderTemplate(res, req, "point.ejs", { point: userdb.point.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), user });
});


app.post('/point/hsm', async (req, res) => {
  const user = req.user;

  if (user === undefined) return errRetrun

  const userEmail = user.email
  const userId = userEmail.substring(0, userEmail.indexOf('@'))

  const data = req.body;
  const points = parseFloat(data.points)

  const errRetrun = res.status(400).json({ message: 'Error occurred while processing data' });

  if (data.adminPassword !== "1245") return errRetrun // TODO: 비밀번호 db 연동할것
  if (points < 0) return errRetrun

  const userdb = (await User.find({ id: userId }))[0]
  if ((userdb.point - points) < 0) return errRetrun

  userdb.point = userdb.point-points

  await userdb.save().then(() => res.json({ message: 'Data received successfully' }))
});


app.get('/board', async (req, res) => {
  const user = req.user;
  if (user === undefined) return res.redirect('/login')

  if (req.query.id) {
    const postdb = (await Post.find({ id: req.query.id }))[0]
    renderTemplate(res, req, "view.ejs", { postdb, user }) // TODO: db 연동 추가할것
  } else {
    renderTemplate(res, req, "board.ejs", { user })
  }
});


app.get('/auth/logout', (req, res, next)=>{
  const user = req.user;
  req.logOut(err => {
    if (err) {
      return next(err);
    } else {
      res.redirect('/login');
      console.log(`logout | ${user.name} / ${user.email}`)
    }
  });
});

app.use((err, req, res, next)=>{
  if(err) console.log(err);
  res.send(err);
});

app.use((req, res, next)=> res.status(404).render(path.resolve(`${templateDir}${path.sep}404.ejs`)))

if (startType === "https") {
  const options = {
    key: fs.readFileSync("./config/private.key"),
    cert: fs.readFileSync("./config/certificate.crt"),
  }
  https.createServer(options, app).listen(443, () => {
    console.log(`HTTPS server started on port 443`);
  })
} else if (startType === "http") {
  app.listen("3000", () => {
    console.log(`HTTP server started on port 3000`)
  })
}

