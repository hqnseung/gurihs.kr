
const checkIsApp = async (req, res, next) => {
    if (!req.rawHeaders.join(' ').includes('WebView') || req.rawHeaders.join(' ').includes('kakao') || req.rawHeaders.join(' ').includes('Instagram')) {
        res.redirect("/installApp")
    } else {
        next()
    }
}

module.exports = checkIsApp