const {clearDomainName, appIdModify} = require('../../Functions');
const platform = require('../platform');
const validateBundle = require('./validateBundle');
const checkBundlesForScape = require('./checkBundlesForScape');
//const isAppStrictValid = require('./isAppStrictValid')

module.exports = (request, sspid, device) => {
    let app = {};

    //bundle
    request['app']['bundle'] !== undefined && (app['bundle'] = request['app']['bundle']);

    //domain
    request['app']['domain'] !== undefined && (app['domain'] = request['app']['domain']);
    app['domain'] && (app['domain'] = clearDomainName(app['domain']));

    //storeurl
    request['app']['storeurl'] !== undefined && (app['storeurl'] = request['app']['storeurl']);

    //privacypolicy
    request['app']['privacypolicy'] !== undefined && (app['privacypolicy'] = request['app']['privacypolicy']);

    //paid
    request['app']['paid'] !== undefined && (app['paid'] = request['app']['paid']);

    //ver
    request['app']['ver'] !== undefined && (app['ver'] = request['app']['ver']);

    if (!validateBundle(app, device, request)) return false;
    //cat, pagecat, publisher, request
    platform(app, sspid, request.app, 'app');

    //id
    app['id'] = appIdModify({app: app});

    //name
    request['app']['name'] && (app['name'] = request['app']['name']);

    checkBundlesForScape(app, request);

    return app;
}
