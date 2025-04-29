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
const statusMonitor = require('express-status-monitor');
const morgan = require('morgan');

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

app.use(statusMonitor());
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

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

app.get('/status', statusMonitor().pageRoute);
app.get('/app/privacy', (req, res) => renderTemplate(res, req, "privacy.ejs"));
app.get('/installApp', (req, res) => renderTemplate(res, req, "installApp.ejs"));

app.use((err, req, res, next) => {
  console.error(err);
  res.send(err);
});

app.use((req, res, next) => res.status(404).render(path.resolve(`${templateDir}${path.sep}404.ejs`)));

const startServer = () => {
  app.listen(8000, () => {
    console.log('Express server running on port 8000');
  });
};

require("./src/cron")

process.on('uncaughtException', (error) => {
  console.error(`[ uncaughtException ] : ${error.message}`);
});

startServer();
