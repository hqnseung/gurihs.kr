const User = require("../models/User");
const renderTemplate = require("../utils/renderTemplate");

const checkAdmin = async (req, res, next) => {
    if (!req.user) return res.redirect('/login'); 

    const userId = req.user.email.split('@')[0];
    const user = await User.findOne({ id: userId });
  
    if (user.role == "admin") {
        next()
    } else {
        return renderTemplate(res, req, "403.ejs")
    }
}

module.exports = checkAdmin