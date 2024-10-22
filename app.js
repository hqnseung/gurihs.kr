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
const mongoose = require('mongoose');
const passport = require('passport');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');

const DATABASE_URL = process.env.DATABASE_URL
const sessionSecret = process.env.sessionSecret
const startType = process.env.startType
const renderTemplate = require('./utils/renderTemplate');
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

app.use("/", require("./routes/mainRoutes"))
app.use("/", require("./routes/loginRoutes"))
app.use("/", require("./routes/adminRoutes"))
app.use("/gugocup", require("./routes/gugocupRoutes"))

app.get('/app/privacy', (req, res) => renderTemplate(res, req, "privacy.ejs"));
app.get('/installApp', (req, res) => renderTemplate(res, req, "installApp.ejs"));

app.get('/api/statistics', (req, res) => {
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
