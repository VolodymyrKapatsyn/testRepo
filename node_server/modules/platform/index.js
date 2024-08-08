const {siteAppCatModify, siteAppPagecatModify} = require('../../Functions');
const publisher = require('./publisher');
const content = require('./content');
const validateCatForSite = require('./validateCatForSite');

module.exports = (obj, sspid, params, type) => {
    obj.cat = siteAppCatModify(params);
    obj.pagecat = siteAppPagecatModify(params);
    obj.publisher = publisher(sspid, params, type);
    params.content !== undefined && (obj.content = content(params.content));
    type === 'site' && validateCatForSite(obj);
};
