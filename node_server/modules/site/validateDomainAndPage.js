const {clearDomainName} = require('../../Functions');

module.exports = (site) => {
    let domainFromPage = '';
    let matches;

    site['page'] && (matches = site['page'].match(/http[s]{0,1}:\/\/[A-Za-z0-9._-]{1,200}/));
    matches && matches[0] && (domainFromPage = clearDomainName(matches[0]));

    if (domainFromPage && (site['domain'] === '' || domainFromPage.indexOf(site['domain']) === -1))
        site['domain'] = domainFromPage;
    else site['page'] === '' && site['domain'] !== '' &&
    (site['page'] = site['domain']);

    if (site['domain'] === '') return false;
    return true;
}
