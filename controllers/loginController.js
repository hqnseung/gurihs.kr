const User = require('../models/User');
const renderTemplate = require('../utils/renderTemplate');
const { fullPattern, domainPattern } = require('../utils/utils');

// 학생 개인정보 이슈로 로그인 부분 미사용
// 관리자 페이지 로그인용으로만 사용중

// @desc View Login Page
// @route GET /login
const getLoginPage = async (req, res) => {
    req.user ? res.redirect('/main') : renderTemplate(res, req, "login.ejs", { status: "ok" });
}

// @desc Logout
// @route GET /auth/logout
const getLogout = async (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
}

// @desc Google OAuth Callback
// @route GET /auth/google/callback
const googleCallback = async (req, res, next) => {
    const email = req.user.email;

    try {
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
    } catch (err) {
        next(err);
    }
};


module.exports = { getLoginPage, googleCallback, getLogout }