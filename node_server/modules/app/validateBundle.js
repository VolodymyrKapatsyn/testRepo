const { clearDomainName } = require('../../Functions');
const validateBundleForApple = require('./validateBundleForApple');
const validateBundleForAndroid = require('./validateBundleForAndroid');

module.exports = (app, device, content)=>{
    if (!app['bundle']){
        if (app['domain'] && app['domain'].substr(0,3) !== 'com'){
            return false;
        } else {
            app['bundle'] = app['domain'];
        }
    }
    validateBundleForApple(app, device, content);
    validateBundleForAndroid(app);
    const matches = app['bundle'].match(/[A-Za-z0-9:._-]{1,200}/);
    matches && matches[0] && (app['bundle'] = matches[0]);
    return !!(matches && matches[0]);
};
