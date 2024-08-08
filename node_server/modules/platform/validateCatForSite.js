module.exports = (site) => {
    if (site['cat'].length === 1 && site['cat'][0] === 'IAB24')
        site['cat'] = site['pagecat'];
    else (site['pagecat'].length === 1 && site['pagecat'][0] === 'IAB24') &&
    (site['pagecat'] = site['cat']);
};
