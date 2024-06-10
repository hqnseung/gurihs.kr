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
const { DATABASE_URL, googleCredentials, sessionSecret } = require("./env");

const dataDir = path.resolve(`${process.cwd()}${path.sep}`); 
const templateDir = path.resolve(`${dataDir}${path.sep}templates`); 

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));

const options = {
  key: fs.readFileSync("./config/private.key"),
  cert: fs.readFileSync("./config/certificate.crt"),
};

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

      const dataToWrite = {
        id: id,
        name: res.req.user.name.replace(/\d+/g, ''),
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

app.get('/', (req, res) => {
    renderTemplate(res, req, "index.ejs");
});

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
  if (user !== undefined) {
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
                lunch = "오늘 급식정보가 존재하지 않습니다.";
                
            } else {
                const data = response.data;
                const ddishNm = data.mealServiceDietInfo[1].row[0].DDISH_NM;
                lunch = ddishNm;
            }
            await renderTemplate(res, req, "main.ejs", { user, lunch });
        })
        .catch(error => {
            console.error("Error fetching the lunch menu:", error);
        });
  } else {
    res.redirect('/login');
  }
});

app.get('/point', async (req, res) => {
  const user = req.user;
  if (user !== undefined) {
    const email = user.email
    const atIndex = email.indexOf('@');
    const username = email.substring(0, atIndex);
    const parsedData = (await User.find({ id: username }))[0]

    renderTemplate(res, req, "point.ejs", { point: parsedData.point.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), user });
  } else {
    res.redirect('/login');
  }
});

app.post('/point/hsm', async (req, res) => {
  const data = req.body;
  const points = parseFloat(data.points)

  if (data.adminPassword !== "1245") {
    res.status(400).json({ message: 'Error occurred while processing data' });
    return 
  }

  if (req.user === undefined) {
    res.status(400).json({ message: 'Error occurred while processing data' });
    return 
  }

  if (points < 0) {
    res.status(400).json({ message: 'Error occurred while processing data' });
    return 
  }

  const user = (await User.find({ id: req.user.email.substring(0, req.user.email.indexOf('@')) }))[0]

  if ((user.point - points) < 0) {
    res.status(400).json({ message: 'Error occurred while processing data' });
    return 
  }

  user.point = user.point-points

  await user.save().then(() => res.json({ message: 'Data received successfully' }))
  
  
});


app.get('/board', (req, res) => {
  const user = req.user;
  if (user !== undefined) {
    if (req.query.id) {
      renderTemplate(res, req, "view.ejs", { id: req.query.id, user })
    } else {
      renderTemplate(res, req, "board.ejs", { user })
    }
  } else {
    res.redirect('/login');
  }
});


app.get('/auth/logout',(req,res,next)=>{
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

app.use((err,req,res,next)=>{
  if(err) console.log(err);
  res.send(err);
});

app.use((req, res, next)=> res.status(404).render(path.resolve(`${templateDir}${path.sep}404.ejs`)))
app.use((req, res, next)=> res.status(500).render(path.resolve(`${templateDir}${path.sep}500.ejs`)))


https.createServer(options, app).listen(443, () => {
  console.log(`HTTPS server started on port 443`);
});
