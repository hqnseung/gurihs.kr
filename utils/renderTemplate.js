const path = require('path');

const dataDir = path.resolve(`${process.cwd()}${path.sep}`);
const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

const renderTemplate = (res, req, template, data = {}) => {
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), { ...data });
};

module.exports = renderTemplate;