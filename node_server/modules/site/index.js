const crypto = require('crypto');
const platform = require('../platform');
const validateDomainAndPage = require('./validateDomainAndPage');
const { clearDomainName } = require('../../Functions');

const getRef = (ref) => {
    return /^(?:f|ht)tps?\:\/\//.test(ref) ? ref : `http://${ref}`;
}

module.exports = (request, sspid, blockedSitesGlobal) => {
    let site = {};
    //domain
    request['site']['domain'] !== undefined && (site['domain'] = request['site']['domain']);
    site['domain'] || (site['domain'] = '');
    site['domain'].indexOf('.') === -1 && (site['domain'] = '');
    site['domain'] !== '' && (site['domain'] = clearDomainName(site['domain']));

    //page
    request['site']['page'] !== undefined && (site['page'] = request['site']['page']);
    site['page'] || (site['page'] = '');
    site['page'].indexOf('.') === -1 && (site['page'] = '');

    if (!validateDomainAndPage(site, blockedSitesGlobal)) return false;

    //id
    site['id'] = crypto.createHash('md5').update(site['domain']).digest('hex').substr(20);

    //name
    request['site']['name'] !== undefined && (site['name'] = request['site']['name']);
    site['name'] || (site['name'] = site['domain']);
    request['site']['domain'] = site['domain'];

    //mobile
    request['site']['mobile'] !== undefined && (site['mobile'] = request['site']['mobile']);

    //cat, pagecat, publisher, request
    platform(site, sspid, request.site, 'site');

    //ref
    request['site']['ref'] !== undefined && request['site']['ref'] !== '' && (site['ref'] = getRef(request['site']['ref']));

    //keywords
    request['site']['keywords'] !== undefined && (site['keywords'] = request['site']['keywords']);

    //privacypolicy
    request['site']['privacypolicy'] !== undefined && (site['privacypolicy'] = request['site']['privacypolicy']);

    return site;
}
