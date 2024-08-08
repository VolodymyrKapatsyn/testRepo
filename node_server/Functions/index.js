"use strict";

const Library   = require('../Library.json');
const crypto    = require('crypto');
const uniqid    = require('uniqid');
const zlib      = require('zlib');
const lru       = require('./lru');
const cache     = new lru(3000);
const maxmind   = require('maxmind');

const _californiaGeoMap = {
    minLat: 32.5121,
    maxLat: 42.0126,
    minLon: -124.6509,
    maxLon: -114.1315
};

const formatMap = {
    'banner': 1,
    'video': 2,
    'native': 3,
    'pop': 4,
    'video_ctv': 5,
    'video_rewarded': 6,
    'xmlPush': 7,
    'audio': 8
};

let maxmindisp = null;
let maxmindconnectiontype = null;
global.maxmindgeoip = null;

maxmind.open(__dirname + '/../libs/maxmind_bd/GeoIP2-ISP.mmdb').then(lookup => {
    maxmindisp = lookup;
});

maxmind.open(__dirname + '/../libs/maxmind_bd/GeoIP2-Connection-Type.mmdb').then(lookup => {
    maxmindconnectiontype = lookup;
});

maxmind.open(__dirname + '/../libs/maxmind_bd/GeoIP2-City.mmdb').then(lookup => {
    global.maxmindgeoip = lookup;
});


////////////////////////////////functions bid request
const {
    echoBadEnd,
    echoEcho,
    echoGoodEnd,
    echoGoodEndXml,
    echoGzipResponse,
    echoLog,
    echoNoBidEnd,
    echoRedirect
} = require('./echo');
module.exports.echoBadEnd = echoBadEnd;
module.exports.echoEcho = echoEcho;
module.exports.echoGoodEnd = echoGoodEnd;
module.exports.echoGoodEndXml = echoGoodEndXml;
module.exports.echoGzipResponse = echoGzipResponse;
module.exports.echoLog = echoLog;
module.exports.echoNoBidEnd = echoNoBidEnd;
module.exports.echoRedirect = echoRedirect;
module.exports.decodeGzip = require('./decode-gzip');
module.exports.makePostObject = require('./make-post-object');
module.exports.parseResponse = require('./parse-response');
module.exports.makeResponseGzipEncoding = require('./make-response-gzip-encoding');
module.exports.getDspHttpOptions = require('./get-dsp-http-options');
module.exports.addCountCoreBidQpsDSP = require('./add-count-core-bid-qps-dsp');
module.exports.addCountCoreMaxQpsDSP = require('./add-count-core-max-qps-dsp');
module.exports.addCountCoreQpsSSP = require('./add-count-core-qps-ssp');
module.exports.addCountCoreRealQpsDSP = require('./add-count-core-real-qps-dsp');
module.exports.cacheImpression = require('./cache-impression');
module.exports.storeBidEvents = require('./store-bid-events');
module.exports.addPixalateMacros = require('./add-pixalate');
module.exports.prepareClickAdmCode = require('./prepare-click-adm-code');

function checkIsMobile(content, uaObj, ua){

    if (/Apple\sTV|tvOS|SmartTV|TV\sSafari|Opera\sTV|CTV|TSBNetTV|PhilipsTV|CrKey|Roku|NEO-X5|AFT|Nexus\sPlayer|BRAVIA|GoogleTV|PHILIPS\s4k\sTV/g.test(ua)) return 3;
    if (/Windows\sNT|CrOS|Macintosh|Ubuntu/.test(ua)) return 2;
    const deviceType = uaObj.device && uaObj.device.type;
    switch (deviceType) {
        case 'console':
            return 7;
        case 'mobile':
            return 4;
        case 'tablet':
            return 5;
        case 'smarttv':
            return 3;
        default:
            if (uaObj['os']['name'] == 'iOS' || uaObj['os']['name'] == 'Android' || uaObj['os']['name'] == 'BlackBerry'
                || uaObj['os']['name'] == 'Tizen' || uaObj['os']['name'] == 'Windows Phone') return 1;
            return null;
    }
}
module.exports.checkIsMobile = checkIsMobile;

const _checkCaliforniaGeo = (lat, lon) => {
    const latLimit = (lat >= _californiaGeoMap.minLat) && (lat <= _californiaGeoMap.maxLat);
    const lonLimit = (lon >= _californiaGeoMap.minLon) && (lon <= _californiaGeoMap.maxLon);

    return latLimit && lonLimit;
};

function CCPA_check(request) {
    let approved = true;
    const device = request.device;
    if (device['geo']['country'] === 'USA' && !device['geo']['region']) {
        if (device['geo']['lat'] && device['geo']['lon']) {
            approved = !_checkCaliforniaGeo(device['geo']['lat'], device['geo']['lon']);
        } else {
            approved = false;
        }
    } else if (device['geo']['country'] === 'USA' && device['geo']['region'] === 'CA'){
        if(request['regs'] && request['regs']['ext'] && request['regs']['ext']['us_privacy']){
            switch (request['regs']['ext']['us_privacy']){
                case '1YNY':
                case '1YNN':
                case '1YN-':
                case '1-N-':
                case '1-NN':
                case '1-NY':
                    approved = true;
                    break;
                default:
                    approved = false;
                    break;
            }
        } else {
            approved = false;
        }
    }
    return approved;
}
module.exports.CCPA_check = CCPA_check;

const typeObj = {
    banner: '1',
    video: '2',
    native: '3',
    audio: '4'
};

const devicePreSetObj = {
    'android': '1',
    'ios': '2',
    'linux': '3',
    'mac os': '4',
    'windows': '5'
};

module.exports.getDspPreSetKey = (type, trafficType, badtraffic, device) => {
    return `${typeObj[type]}${trafficType === 4 ? '3' : trafficType}${trafficType === 4 ? '4' : '5'}${!device['ifa'] && (trafficType === 3 || trafficType === 4) ? '0' : '1'}${trafficType === 3 && badtraffic ? 0 : 1}${devicePreSetObj[device['os']] || '6'}`;
}

function requestIdModify(ssppartner, content) {
    return ssppartner['id'] + '-' + crypto.createHash('md5').update(content['id']).digest('hex').substr(17) + "-" + (Math.random() * 1000).toFixed(0);
}
module.exports.requestIdModify = requestIdModify;

function impressionIdModify(){
    return `${Math.floor(Math.random() * (2500 - 2)) + 2}`;
}
module.exports.impressionIdModify = impressionIdModify;

module.exports.bcatModify = (request) => {
    if (request['bcat'] !== undefined && Array.isArray(request['bcat'])) return request['bcat'];
}

module.exports.getRandomFloat = (min, max) => {
    const minInt = min * 10000;
    const maxInt = max * 10000;
    return (Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt) / 10000;
};

function getRandomInt(min, max) {
    return (Math.floor(Math.random() * (max - min + 1)) + min);
}

module.exports.getRandomInt = getRandomInt;

module.exports.round = (float) => {
    return Math.round(float * 100000) / 100000;
};

function userIdModify(content, sspPartner) {
    return '';
}

module.exports.userIdModify = userIdModify;

module.exports.battrModify = (request, type) => {
    if (request['imp'][0][type]['battr'] !== undefined && Array.isArray(request['imp'][0][type]['battr'])) return request['imp'][0][type]['battr'];
}

module.exports.siteAppPublisherIdModify = (sspid, request, type) => {
    let publisherId = '';

    if (!request[type]['publisher'] || !request[type]['publisher']['id']) {
        if (type == 'site' && request[type]['domain']){
            publisherId = `${sspid.toString()}${request[type]['domain'].charCodeAt(0).toString()}`;
        } else if (type == 'app' && request[type]['bundle']) {
            publisherId = `${sspid.toString()}${request[type]['bundle'].charCodeAt(0).toString()}`;
        }
    } else publisherId = request[type]['publisher']['id'];

    return publisherId.toString();
};

function siteAppCatModify(content) {

    let cats = ['IAB1'];
    if (Array.isArray(content.cat) && content.cat.length > 0) cats = content.cat

    return cats;
}
module.exports.siteAppCatModify = siteAppCatModify;

function siteAppPagecatModify(content) {

    let pagecats = [];
    if (Array.isArray(content.pagecat) && content.pagecat.length > 0) pagecats = content.pagecat

    return pagecats;
}
module.exports.siteAppPagecatModify = siteAppPagecatModify;

function widthHeightModify(request, type) {
    if (type === 'banner') {
        if (!request['imp'][0]['banner']['w'] || !request['imp'][0]['banner']['h']) {
            let size = `${request['imp'][0]['banner']['format'][0]['w']}x${request['imp'][0]['banner']['format'][0]['h']}`;
            request['imp'][0]['banner']['w'] = request['imp'][0]['banner']['format'][0]['w'];
            request['imp'][0]['banner']['h'] = request['imp'][0]['banner']['format'][0]['h'];
            if (request['imp'][0]['banner']['format'] && Array.isArray(request['imp'][0]['banner']['format']) && request['imp'][0]['banner']['format'].length > 1) {
                for (let cnt = 1; cnt < request['imp'][0]['banner']['format'].length; ++cnt) {
                    size = `${request['imp'][0]['banner']['format'][cnt]['w']}x${request['imp'][0]['banner']['format'][cnt]['h']}`;
                    if (size === '300x250' || size === '728x90' || size === '320x50') {
                        request['imp'][0]['banner']['w'] = request['imp'][0]['banner']['format'][cnt]['w'];
                        request['imp'][0]['banner']['h'] = request['imp'][0]['banner']['format'][cnt]['h'];
                        break;
                    }
                }
            }
        } else {
            let size = `${request['imp'][0]['banner']['w']}x${request['imp'][0]['banner']['h']}`;
            if (request['imp'][0]['banner']['format'] && Array.isArray(request['imp'][0]['banner']['format']) && size !== '300x250' && size !== '728x90' && size !== '320x50') {
                for (let cnt = 0; cnt < request['imp'][0]['banner']['format'].length; ++cnt) {
                    size = `${request['imp'][0]['banner']['format'][cnt]['w']}x${request['imp'][0]['banner']['format'][cnt]['h']}`;
                    if (size === '300x250' || size === '728x90' || size === '320x50') {
                        request['imp'][0]['banner']['w'] = request['imp'][0]['banner']['format'][cnt]['w'];
                        request['imp'][0]['banner']['h'] = request['imp'][0]['banner']['format'][cnt]['h'];
                        break;
                    }
                }
            }
        }
    }

    if (!request['imp'][0][type]['h'] || request['imp'][0][type]['h'] < 20) {
        request['imp'][0][type]['w'] = 300;
        request['imp'][0][type]['h'] = 250;
    }

    return true;
}
module.exports.widthHeightModify = widthHeightModify;

function appIdModify(request) {
    let appId = '';

    if (request['app']['bundle'] !== undefined && request['app']['bundle'] !== '') {
        request['app']['bundle'] = request['app']['bundle'].toString().replace(/https:\/\/|http:\/\//g, '');
        appId = crypto.createHash('md5').update(request['app']['bundle']).digest('hex').substr(20);
    } else if (request['app']['name'] !== undefined && request['app']['name'] !== '') {
        appId = crypto.createHash('md5').update(request['app']['name']).digest('hex').substr(20);
    }

    return appId;
}
module.exports.appIdModify = appIdModify;

function clearDomainName(domain){
    return domain.toString().trim().toLowerCase().replace(/https:\/\/|http:\/\/|www\.|\/.+|\//g, '');
}
module.exports.clearDomainName = clearDomainName;

function deviceGeoRegionModify(deviceGeo) {
    if (deviceGeo['region'] && deviceGeo['region'].length !== 2 && deviceGeo['country'] === 'USA') {
        delete deviceGeo['region'];
    }
}
module.exports.deviceGeoRegionModify = deviceGeoRegionModify;

const isObject = val => {
    return (!!val) && (val.constructor === Object);
};

/**
 * @description append value to dest object only if it passes validation
 * @param {object} dest destination object to appending
 * @param {string} name name of appended value
 * @param {any} value appended value
 * @param {Function} isValid validator for value param
 */
function appendValidProperty(dest, name, value, isValid) {
    if (isValid(value)) {
        dest[name] = value;
    }
}

const latLongValidator = (lat, lon) => {
    if (typeof lat !== 'number') return false
    if (typeof lon !== 'number') return false
    return ((lat <= 90) && (lat => -90) && (lon <= 180) && (lon >= -180))
}

/**
 * @description validate string param value
 * @param {any} value value for validation
 * @returns {boolean}
 */
function isValidStringParamValue(value){
    return value && value !== 'undefined' && value !== 'null';
}

module.exports.deviceGeoModify = (request) => {
    const ip = typeof request['device']['ipv6'] === 'string' && request['device']['ipv6']
        ? request['device']['ipv6']
        : (typeof request['device']['ip'] === 'string' && request['device']['ip']) || '';

    let deviceGeo = {};
    let emptyurgent = 0;
    let tempMaxmindGeo = undefined;
    let country = undefined;

    if (!request['device']['geo'] || !request['device']['geo']['country'] || /[A-Z]{3}/.test(convertCountryTo3Letters(request['device']['geo']['country'])) === false) {
        emptyurgent = 2;
    } else if (!request['device']['geo']['city'] || !request['device']['geo']['region']) {
        deviceGeo = request['device']['geo'];
        emptyurgent = 1;
    } else if ((request['device']['geo']['type'] === 2) && (request['device']['geo']['lat'] === undefined) && (request['device']['geo']['lon'] === undefined)) {
        deviceGeo = request['device']['geo'];
        emptyurgent = 1;
    } else if ((request['device']['geo'] !== undefined) && (!latLongValidator(request['device']['geo']['lat'], request['device']['geo']['lon']))) {
        deviceGeo = request['device']['geo'];
        emptyurgent = 1;
    }

    tempMaxmindGeo = cache.read(ip) || global.maxmindgeoip.get(ip);

    if (!tempMaxmindGeo) {
        if (emptyurgent === 2) return false;
        let type = request['device']['geo'] !== undefined && request['device']['geo']['type'] !== undefined ? parseInt(request['device']['geo']['type']) : undefined;
        if (!type || type < 1 || type > 3) type = ip ? 2 : undefined;
        if (type) deviceGeo['type'] = type;
        deviceGeo['lat'] = parseFloat(request['device']['geo']['lat']) || 0;
        deviceGeo['lon'] = parseFloat(request['device']['geo']['lon']) || 0;
        deviceGeo['accuracy'] = parseInt(request['device']['geo']['accuracy']) || 0;
        deviceGeo['country'] = convertCountryTo3Letters(request['device']['geo']['country']);
        appendValidProperty(deviceGeo, 'region', request['device']['geo']['region'], isValidStringParamValue);
        appendValidProperty(deviceGeo, 'city', request['device']['geo']['city'], isValidStringParamValue);
        appendValidProperty(deviceGeo, 'metro', request['device']['geo']['metro'], isValidStringParamValue);
        appendValidProperty(deviceGeo, 'zip', request['device']['geo']['zip'], isValidStringParamValue);

        return deviceGeo;
    }

    cache.write(ip, tempMaxmindGeo);

    if (tempMaxmindGeo['country'] && tempMaxmindGeo['country']['iso_code'] && tempMaxmindGeo['country']['iso_code'] !== 'undefined') {
        country = deviceGeo['country'] = convertCountryTo3Letters(tempMaxmindGeo['country']['iso_code']);
    } else if (tempMaxmindGeo['registered_country'] && tempMaxmindGeo['registered_country']['iso_code'] && tempMaxmindGeo['registered_country']['iso_code'] !== 'undefined') {
        country = deviceGeo['country'] = convertCountryTo3Letters(tempMaxmindGeo['registered_country']['iso_code']);
    }

    if (request['device'] && request['device']['geo'] && request['device']['geo']['type'] === 1 && emptyurgent === 0) {
        deviceGeo['type'] = 1;
        deviceGeo['country'] = convertCountryTo3Letters(request['device']['geo']['country']);
        appendValidProperty(deviceGeo, 'lon', parseFloat(request['device']['geo']['lon']), isValidStringParamValue);
        appendValidProperty(deviceGeo, 'lat', parseFloat(request['device']['geo']['lat']), isValidStringParamValue);
        appendValidProperty(deviceGeo, 'accuracy', parseInt(request['device']['geo']['accuracy']), isValidStringParamValue);
        appendValidProperty(deviceGeo, 'region', request['device']['geo']['region'], isValidStringParamValue);
        appendValidProperty(deviceGeo, 'city', request['device']['geo']['city'], isValidStringParamValue);
        appendValidProperty(deviceGeo, 'metro', request['device']['geo']['metro'], isValidStringParamValue);
        appendValidProperty(deviceGeo, 'zip', request['device']['geo']['zip'], isValidStringParamValue);

        if (convertCountryTo3Letters(request['device']['geo']['country']) === country) return deviceGeo;
    }

    deviceGeo['type'] = 2;
    deviceGeo['ipservice'] = 3;

    if (tempMaxmindGeo['location']) {
        if (tempMaxmindGeo['location']['longitude'] && tempMaxmindGeo['location']['longitude'] !== 'undefined') {
            deviceGeo['lon'] = tempMaxmindGeo['location']['longitude'];
        }
        if (tempMaxmindGeo['location']['latitude'] && tempMaxmindGeo['location']['latitude'] !== 'undefined') {
            deviceGeo['lat'] = tempMaxmindGeo['location']['latitude'];
        }
        if (tempMaxmindGeo['location']['metro_code'] && tempMaxmindGeo['location']['metro_code'] !== 'undefined') {
            deviceGeo['metro'] = `${tempMaxmindGeo['location']['metro_code']}`;
        }
        if (tempMaxmindGeo['location']['accuracy_radius'] && tempMaxmindGeo['location']['accuracy_radius'] !== 'undefined') {
            deviceGeo['accuracy'] = tempMaxmindGeo['location']['accuracy_radius'];
        }
    }
    if (tempMaxmindGeo['city'] && tempMaxmindGeo['city']['names']['en'] && tempMaxmindGeo['city']['names']['en'] !== 'undefined') {
        deviceGeo['city'] = tempMaxmindGeo['city']['names']['en'];
    }
    if (tempMaxmindGeo['city'] && tempMaxmindGeo['city']['geoname_id']) {
        if (!isObject(request['ext'])) request['ext'] = {};
        request['ext']['cityGeoId'] = tempMaxmindGeo['city']['geoname_id'].toString();
    }
    if (tempMaxmindGeo['postal'] && tempMaxmindGeo['postal']['code'] && tempMaxmindGeo['postal']['code'] !== 'undefined') {
        deviceGeo['zip'] = tempMaxmindGeo['postal']['code'];
    }
    if (tempMaxmindGeo['subdivisions'] && (tempMaxmindGeo['subdivisions'].length > 0) && tempMaxmindGeo['subdivisions'][0]['iso_code'] &&
        tempMaxmindGeo['subdivisions'][0]['iso_code'] !== 'undefined') {
        deviceGeo['region'] = tempMaxmindGeo['subdivisions'][0]['iso_code'];
    }
    if (deviceGeo['country'] && deviceGeo['country'].length < 3) {
        deviceGeo['country'] = convertCountryTo3Letters(deviceGeo['country']);
    }

    return deviceGeo;
}

/**
 * Device id validation
 * @param {Object} request - Original bid request from SSP
 * @returns {string} ifa - Device id or empty string
 */
function deviceIfaModify(request) {
    let ifa = '';

    if (request['device']['ifa'] === undefined && request['ext'] !== undefined && request['ext']['udi'] !== undefined) {
        if (request['ext']['udi']['gaid'] !== undefined) {
            ifa = `${request['ext']['udi']['gaid']}`;
        } else if (request['ext']['udi']['idfa']) {
            ifa = `${request['ext']['udi']['idfa']}`;
        }
    } else if (request['device']['ifa'] !== undefined) {
        ifa = `${request['device']['ifa']}`;
    }

    if (ifa !== '' && (/^[a-z0-9]{8}-([a-z0-9]{4}-)+[a-z0-9]{12}$/i.test(ifa) === false || ifa === '00000000-0000-0000-0000-000000000000')) {
        ifa = '';
    }

    return ifa;
}
module.exports.deviceIfaModify = deviceIfaModify;


/**
 * Get carrier from maxmind database
 * @param {Object} content - Original bid request from SSP
 * @returns {string} carrier - Carrier name or empty string
 */
function deviceCarrierModify(content) {
    let ip = '';
    if (content['device']['ip']) {
        ip = content['device']['ip'];
    } else if (content['device']['ipv6']) {
        ip = content['device']['ipv6'];
    }

    let carrier = '';
    let objTemp = maxmindisp.get(ip);
    if (objTemp != null && objTemp['isp'] != undefined && objTemp['isp'] != 'undefined') {
        carrier = objTemp['isp'];
    }

    if (carrier == '' && content['device']['carrier']) carrier = content['device']['carrier'];

    return carrier;
}
module.exports.deviceCarrierModify = deviceCarrierModify;

/**
 * Get connectiontype from maxmind database
 * @param {Object} content - Original bid request from SSP
 * @returns {number} connectiontype - Open RTB connectiontype
 */
function deviceConnectionTypeModify(content) {
    let ip = '';
    if (content['device']['ip']) {
        ip = content['device']['ip'];
    } else if (content['device']['ipv6']) {
        ip = content['device']['ipv6'];
    }

    let connectiontype = 0;

    let objTemp = maxmindconnectiontype.get(ip);
    let temp = 'null';
    if (objTemp != null && objTemp['connection_type'] != undefined) {
        temp = objTemp['connection_type'];
    }
    if (Library.ConnectionTypeRTB[temp] != undefined) {
        connectiontype = Library.ConnectionTypeRTB[temp];
    } else {
        console.log('Unknown connectiontype', temp);
        connectiontype = 0;
    }

    if (connectiontype === 3 && content['device']['connectiontype'] > 4 && content['device']['connectiontype'] < 7) {
        connectiontype = parseInt(content['device']['connectiontype'], 10) || connectiontype;
    }
    if (connectiontype === 0 && content['device']['connectiontype'] > 0 && content['device']['connectiontype'] < 7) {
        connectiontype = parseInt(content['device']['connectiontype'], 10) || 0;
    }
    if (connectiontype === 4) connectiontype = 3;

    return connectiontype;
}
module.exports.deviceConnectionTypeModify = deviceConnectionTypeModify;

function deviceOsModify(content, uaObj) {
    if (uaObj['os']['name'] != undefined){
        return uaObj['os']['name'].toLowerCase();
    } else if (content['device']['os']){
        return content['device']['os'].toLowerCase();
    } else {
        return 'other';
    }
}
module.exports.deviceOsModify = deviceOsModify;

function deviceOsVersionModify(content, uaObj) {
    if (uaObj['os']['version'] != undefined){
        return uaObj['os']['version'].replace(',','.');
    } else if (content['device']['osv']){
        return content['device']['osv'].toString().replace(',','.');
    } else {
        return '';
    }
}
module.exports.deviceOsVersionModify = deviceOsVersionModify;

function convertCountryTo3Letters(country) {
    let device_geo_country = '';

    if (country == undefined) {
        return device_geo_country;
    }

    country = country.toUpperCase();

    if (country.length !== 3) {
        device_geo_country = Library.countryesto2letters[0][country] || '';
    } else {
        device_geo_country = country;
    }

    return device_geo_country;
}
module.exports.convertCountryTo3Letters = convertCountryTo3Letters;
////////////////////////////////////////////////////////

/////////////////////////COUNTERS
function addCountryCoreBidQps(Object_, key) {
    if (Object_['writeObj'] && Object_['writeObj'] == 1) {

        if (Object_[key] !== undefined) {
            Object_[key]++;
        } else {
            Object_[key] = 1;
        }
    }

    return true;
}
module.exports.addCountryCoreBidQps = addCountryCoreBidQps;
//////////////////////

//regex to find all urls (including ip-addresses) in string
const regexp = /\b(%[a-z0-9-]{2})?((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/ig;

function checkForTmtDomains(adm, tmtDomains) {
    //find all urls in adm
    const matches = adm.match(regexp);

    //no urls found
    if (!matches) return false;

    //try to find at least one founded url in blocked list
    let i;
    let l = matches.length;

    for (i = 0; i < l; ++i) {

        if(matches[i].charAt(0) == '%') {
            matches[i] = matches[i].replace(/%[a-z0-9-]{2}/i, '');
        }

        if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(matches[i])) {
            if (tmtDomains[matches[i]]) return matches[i];

        } else {
            // 123.abc.com -> ['com', 'abc', '123']
            const parts = matches[i].split('.').reverse();

            let tmp = parts[0];
            let j;
            let l_ = parts.length;
            for (j = 1; j < l_; ++j ) {
                tmp = parts[j] + '.' + tmp;

                if (tmtDomains[tmp]) {
                    return tmp;
                }
            }
        }
    }

    return false;
}
module.exports.checkForTmtDomains = checkForTmtDomains;

function addGDPR(request, post_data_object, requiredForDSP) {
    const coppa = (request && request['regs'] && request['regs']['coppa'] ? request['regs']['coppa'] : -1);
    const gdpr = (request && request['regs'] && request['regs']['ext'] && request['regs']['ext']['gdpr'] ? request['regs']['ext']['gdpr'] : -1);
    const consent = (request && request['user'] && request['user']['ext'] && request['user']['ext']['consent'] ? request['user']['ext']['consent'] : null);
    const requestHasGDPR = (coppa > -1 || gdpr > -1);
    const alreadyHasGDPR = post_data_object.hasOwnProperty('regs');
    requiredForDSP = requiredForDSP || false;
    if ((requestHasGDPR || requiredForDSP)
        && !alreadyHasGDPR) {
        post_data_object['regs'] = {
            'coppa': Math.max(coppa, 0),
            'ext': {'gdpr': Math.max(gdpr, 0)}
        };
        if (consent) {
            if (!post_data_object.user.hasOwnProperty('ext')) {
                post_data_object.user.ext = {};
            }
            post_data_object['user']['ext']['consent'] = consent;
        }
    }
}

module.exports.addGDPR = addGDPR;

function requestGDPRmodify(request) {
    const coppa = (request['regs'] !== undefined && request['regs']['coppa'] !== undefined ? request['regs']['coppa'] : 0);
    const gdpr = (request ['regs'] !== undefined && request ['regs']['ext'] !== undefined && request ['regs']['ext']['gdpr'] !== undefined ? request ['regs']['ext']['gdpr'] : 0);
    const consent = (request ['user'] !== undefined && request ['user']['ext'] !== undefined && request ['user']['ext']['consent'] !== undefined ? request ['user']['ext']['consent'] : '');
    // const requestHasGDPR = (coppa > -1 || gdpr > -1);

    let objGDPR = {};
    objGDPR['coppa'] = coppa;
    objGDPR['gdpr'] = gdpr;
    objGDPR['concent'] = consent;

    return objGDPR;
}
module.exports.requestGDPRmodify = requestGDPRmodify;

function getNumberFromIp( arrTriads ) {
    return (+arrTriads[0]) * Math.pow(256, 3) + (+arrTriads[1]) * Math.pow(256, 2) + (+arrTriads[2]) * 256 + (+arrTriads[3]);
}
module.exports.getNumberFromIp = getNumberFromIp;

function checkOnBanListByIp(rangeIps, ipIninteger) {
    let i;
    let l = rangeIps.length;
    for (i = 0; i < l; i++) {

        let oneRange = rangeIps[i];

        if (ipIninteger >= oneRange['from'] && ipIninteger <= oneRange['to']) {
            return true;
        }
    }

    return false;
}
module.exports.checkOnBanListByIp = checkOnBanListByIp;

module.exports.wrapWithCdata = function (xml) {
    xml = xml.replace(/(\r|\n|\t)/gm,"");
    xml = xml.replace(/>\s+</g, '><');
    xml = xml.replace(/<!\[CDATA\[/g, "").replace(/]]>/g, "");
    xml = xml.replace(/>\/\//g, "><![CDATA[http://");
    xml = xml.replace(/>http/g, "><![CDATA[http");
    xml = xml.replace(/(CDATA[a-zA-Z0-9@=&:; \*\#\–\~\+\|\$\,\\\/\?\!_\[\]\.\'\-\%\(\)\{\}]*)([^>| ])(\s*<\W*\/\W*(HTMLResource|IFrameResource|IconClickThrough|IconClicks|URL|CompanionClickTracking|Tracking|ClickTracking|Error|Impression|VASTAdTagURI|MediaFile|ClickThrough|CompanionClickThrough|StaticResource)\W*>)/ig, "$1$2]]>$3");
    xml = xml.replace(/<\s*AdParameters\s*>\s*(.*)\s*<\s*\/AdParameters\s*>/, '<AdParameters><![CDATA[$1]]></AdParameters>');

    let match = xml.search(/<Error[^>]/g);
    if (match > 0) {
        xml = xml.substring(0, match) + '<Error>' + xml.substring(xml.indexOf('>', match) + 1);
    }

    match = xml.search(/<Ad[>]/g);
    if (match > 0) {
        xml = xml.substring(0, match) + '<Ad id=\"'+(Math.random()*1000).toFixed(0)+'\">' + xml.substring(xml.indexOf('>', match) + 1);
    }

    return xml;
};

module.exports.getAdomain = function(adomain, ssp) {
    const resp = [];
    if (Array.isArray(adomain) && adomain.length > 0) {
        for (let i = 0, len = adomain.length; i < len; i++) {
            if (adomain[i] && adomain[i].trim().length !== 0) {
                resp[0] = adomain[i].replace(/https:\/\/|http:\/\/|www\./g, '');
                break;
            }
        }
    } else if (typeof adomain === 'string' && adomain.trim().length !== 0) {
        resp[0] = adomain.replace(/https:\/\/|http:\/\/|www\./g, '')
    } else if (ssp.company === 'admixer') {
        resp[0] = Library.RandomAdomains[getRandomInt(0, Library.RandomAdomains.length - 1)];
    }
    return resp;
}

module.exports.modifyAdmcodeForScan = function(admcode, url) {
    let tmpchunk = "";

    if (admcode.indexOf("</VASTAdTagURI>") !== -1) {
        tmpchunk = admcode.split("</VASTAdTagURI>");
        admcode = tmpchunk[0];
        for (let i = 1; i < tmpchunk.length; i++) {
            admcode += "</VASTAdTagURI>" + (i === 1 ? url : "") + tmpchunk[i];
        }
    } else if (admcode.indexOf("%3C%2FVASTAdTagURI%3E") !== -1) {
        tmpchunk = admcode.split("%3C%2FVASTAdTagURI%3E");
        admcode = tmpchunk[0];
        for (let i = 1; i < tmpchunk.length; i++) {
            admcode += "%3C%2FVASTAdTagURI%3E" + (i == 1 ? encodeURIComponent(url) : "") + tmpchunk[i];
        }
    }
    else if (admcode.indexOf("</VASTAdTagURI>") != -1) {
        tmpchunk = admcode.split("</VASTAdTagURI>");
        admcode = tmpchunk[0];
        for (let i = 1; i < tmpchunk.length; i++) {
            admcode += "</VASTAdTagURI>" + (i == 1 ? url : "") + tmpchunk[i];
        }
    } else if (admcode.indexOf("%3C%2FVASTAdTagURI%3E") != -1) {
        tmpchunk = admcode.split("%3C%2FVASTAdTagURI%3E");
        admcode = tmpchunk[0];
        for (let i = 1; i < tmpchunk.length; i++) {
            admcode += "%3C%2FVASTAdTagURI%3E" + (i == 1 ? encodeURIComponent(url) : "") + tmpchunk[i];
        }
    }
    else if (admcode.indexOf("<Impression>") != -1) {
        tmpchunk = admcode.split("<Impression>");
        admcode = "";
        tmpchunk[0] = tmpchunk[0] + url;
        for (let i = 0; i < tmpchunk.length; i++) {
            admcode += (i >= 1 ? "<Impression>" : "") + tmpchunk[i];
        }
    }
    else if (admcode.indexOf("%3CImpression%3E") != -1) {
        tmpchunk = admcode.split("%3CImpression%3E");
        admcode = "";
        tmpchunk[0] = tmpchunk[0] + encodeURIComponent(url);
        for (let i = 0; i < tmpchunk.length; i++) {
            admcode += (i >= 1 ? "%3CImpression%3E" : "") + tmpchunk[i];
        }
    }
    else if (admcode.indexOf("</Impression>") != -1) {
        tmpchunk = admcode.split("</Impression>");
        admcode = tmpchunk[0];
        for (let i = 1; i < tmpchunk.length; i++) {
            admcode += "</Impression>" + (i === 1 ? url : "") + tmpchunk[i];
        }
    }
    else if (admcode.indexOf("<Impression/>") != -1) {
        admcode = admcode.replace("<Impression/>", url);
    }
    else if (admcode.indexOf("<Creatives>") != -1) {
        tmpchunk = admcode.split("<Creatives>");
        admcode = tmpchunk[0];
        for (let i = 1; i < tmpchunk.length; i++) {
            admcode += (i == 1 ? url : "") + "<Creatives>" + tmpchunk[i];
        }
    }

    return admcode;
}

module.exports.automaticLog = function(logParameters, logObject, content, ssppartner, params_obj, requestType) {

    let key = ssppartner['name'];
    let toLog = true;
    let bundle = "";

    if(logParameters['aggregate'] == 2) {
        key = (content['app'] ? content['app']['bundle'] : params_obj['site_app_name']);
    } else if (logParameters['aggregate'] == 3) {
        key += '|' + (content['app'] ? content['app']['bundle'] : params_obj['site_app_name']);
    } else if (logParameters['aggregate'] == 4) {
        key = params_obj['objDeviceGeo']['country'];
    } else if (logParameters['aggregate'] == 5) {
        key = params_obj['site_app_id'];
    } else if (logParameters['aggregate'] == 6) {
        key += '|' + params_obj['objDeviceGeo']['country'];
    } else if(logParameters['aggregate'] == 7) {
        bundle = content['app'] ? content['app']['bundle'] : params_obj['site_app_name'];
        key = bundle + '|' + params_obj['objDeviceGeo']['country'];
    } else if (logParameters['aggregate'] == 8){
        key = requestType + '|' + params_obj['trafftype'];
    } else if (logParameters['aggregate'] == 9){
        key = requestType + '|' + params_obj['trafftype'] + '|' + params_obj['objDeviceGeo']['country'];
    } else if (logParameters['aggregate'] == 10){
        key = requestType + '|' + params_obj['trafftype'] + '|' + params_obj['size'];
    } else if (logParameters['aggregate'] == 11){
        key = requestType + '|' + params_obj['trafftype'] + '|' + params_obj['objDeviceGeo']['country'] + '|' + params_obj['size'];
    }

    if (toLog && logParameters['categories'] && logParameters['categories'].length > 0) {
        toLog = false;
        if (typeof logParameters['categories'] === 'string') {
            logParameters['categories'] = [logParameters['categories']];
        }
        logParameters['categories'].forEach( (cat) => {
            if (params_obj['cats'].indexOf(cat) != -1) toLog = true;
        });
    }

    if (toLog && logParameters['gps'] && logParameters['gps'].length > 0) {
        toLog = false;
        if (params_obj['objDeviceGeo'] && params_obj['objDeviceGeo']['lat'] && params_obj['objDeviceGeo']['lon']){
            logParameters['gps'].forEach( (zone) => {
                const logLon = zone.lon * (Math.PI / 180);
                const logLat = zone.lat * (Math.PI / 180);
                const reqLon = params_obj['objDeviceGeo']['lon'] * (Math.PI / 180);
                const reqLat = params_obj['objDeviceGeo']['lat'] * (Math.PI / 180);
                const distance = Math.acos(
                    Math.sin(logLat) * Math.sin(reqLat) +
                    Math.cos(logLat) * Math.cos(reqLat) *
                    Math.cos(logLon - reqLon)
                ) * 6371.01;
                if (distance < zone.radius) {
                    toLog = true;
                }
            });
        }
    }

    if (toLog && logParameters['zipcodes'] && logParameters['zipcodes'].length > 0) {
        toLog = false;
        logParameters['zipcodes'].forEach( (zip) => {
            if (params_obj['objDeviceGeo']['zip'] === zip) toLog = true;
        });
    }

    if (toLog && logParameters['mraid']) {
        toLog = false;
        logParameters['mraid'].forEach( (mraid) => {
            if ((logParameters['type'].includes('banner') && content["imp"][0]['banner']['api'] && content["imp"][0]['banner']['api'].indexOf(mraid) !== -1) ||
                (logParameters['type'].includes('native') && content["imp"][0]['native']['api'] && content["imp"][0]['native']['api'].indexOf(mraid) !== -1) ||
                (logParameters['type'].includes('video') && content["imp"][0]['video']['api'] && content["imp"][0]['video']['api'].indexOf(mraid) !== -1) )toLog = true;
        });
    }

    if (toLog && logParameters['countries'] && logParameters['countries'].length > 0) {
        if (logParameters['countries'].indexOf(params_obj['objDeviceGeo']['country']) === -1) toLog = false;
    }

    if (toLog && logParameters['carriers'] && logParameters['carriers'].length > 0) {
        toLog = false;
        logParameters['carriers'].forEach( (carrier) =>  {
            if (params_obj['device_carrier'].includes(carrier)) toLog = true;
        });

    }

    if (toLog && logParameters['states'] && logParameters['states'].length > 0) {
        if (logParameters['states'].indexOf(params_obj['objDeviceGeo']['region']) == -1) toLog = false;
    }

    if (toLog && logParameters['ssp'] && logParameters['ssp'].length > 0) {
        if (logParameters['ssp'].indexOf(ssppartner['name']) == -1) toLog = false;
    }

    if (toLog && logParameters['cities'] && logParameters['cities'].length > 0) {
        if (params_obj['objDeviceGeo']['city']){
            if (logParameters['cities'].indexOf(params_obj['objDeviceGeo']['city'].toLowerCase()) == -1) toLog = false;
        } else {
            toLog = false;
        }
    }

    if (toLog && logParameters['languages'] && logParameters['languages'].length > 0) {
        if (!content['device']['language']) {
            toLog = false;
        } else if (logParameters['languages'].indexOf(content['device']['language'].toLowerCase()) == -1) {
            toLog = false;
        }
    }

    if (toLog && logParameters['os'] && logParameters['os'].length > 0) {
        if (logParameters['os'].indexOf(params_obj['device_os'].toLowerCase()) == -1) toLog = false;
    }

    if (toLog && logParameters['browsers'] && logParameters['browsers'].length > 0) {
        if (logParameters['browsers'].indexOf(params_obj['browser'].toLowerCase()) == -1) toLog = false;
    }

    if (toLog && logParameters['devtypes'] && logParameters['devtypes'].length > 0) {
        if (logParameters['devtypes'].indexOf(''+content['device']['devicetype']) == -1) toLog = false;
    }

    if (toLog && logParameters['maxbf']) {
        if(logParameters['maxbf'] < params_obj['bf']) toLog = false;
    }

    if (toLog && logParameters['tmax']) {
        if(logParameters['tmax'] > content['tmax']) toLog = false;
    }

    if (toLog && logParameters['mismatch']) {
        if (logParameters['mismatch'] == true && params_obj['mismatchedIpTraff']) toLog = false;
    }

    if (toLog && logParameters['conntypes'] && logParameters['conntypes'].length > 0) {
        if (logParameters['conntypes'].indexOf(''+params_obj['device_connection_type']) === -1) toLog = false;
    }

    if (toLog && logParameters['sizes'] && logParameters['sizes'].length > 0) {
        if (logParameters['sizes'].indexOf(params_obj['size']) == -1) toLog = false;
    }

    if (toLog && logParameters['ifa']) {
        if (logParameters['ifa'] == true && !params_obj['device_ifa']) toLog = false;
    }

    if (toLog && logParameters['bundles'] && logParameters['bundles'].length > 0) {
        if (!content['app'] || logParameters['bundles'].indexOf(content['app']['bundle'].toLowerCase()) == -1) toLog = false;
    }

    if (toLog && logParameters['domains'] && logParameters['domains'].length > 0) {
        if (!content['site'] || logParameters['domains'].indexOf(params_obj['site_app_name'].toLowerCase()) == -1) toLog = false;
    }

    if (toLog && logParameters['knownBundles'] && logParameters.scapedBundles) {
        if (!logParameters.scapedBundles[bundle.toLowerCase()]){
            toLog = false;
        }
    }

    if (toLog && logParameters['traffic'] && logParameters['traffic'].length > 0) {
        if(logParameters['traffic'].indexOf(''+params_obj['trafftype']) == -1) toLog = false;
    }
    if (logParameters['type'].includes('banner')){

        if (toLog && logParameters['isbanip']) {
            if (logParameters['isbanip'] == true && params_obj['isBannByIp']) toLog = false;
        }
    }

    if (toLog && logParameters['pxblack']) {
        if (logParameters['pxblack'] == true && params_obj['percentPixalateFraud'] > logParameters['pxperc']) toLog = false;
    }

    if (toLog && logParameters['pxwhite']) {
        if (logParameters['pxwhite'] == true && (params_obj['percentPixalateFraud'] === undefined || params_obj['percentPixalateFraud'] > logParameters['pxperc'])) toLog = false;
    }

    if (toLog) {
        if (logObject[key]) {
            logObject[key]['req']++;
            if (Array.isArray(logObject[key]['bf']) || logObject[key]['bf'])  logObject[key]['bf'].push(params_obj['bf']);
            else logObject[key]['bf'] = [ params_obj['bf'] ];
        } else {
            logObject[key] = {};
            logObject[key]['req'] = 1;
            logObject[key]['bf'] = [ params_obj['bf'] ];
        }
    }

};

module.exports.checkIsBlockedByBattr = function (resp, content, type) {
    let isAttrBlocked = false;
    if (resp['data']['seatbid'][0]['bid'][0]['attr'] != undefined
        && Array.isArray(resp['data']['seatbid'][0]['bid'][0]['attr'])
        && resp['data']['seatbid'][0]['bid'][0]['attr'].indexOf(6) !== -1
        && content['imp'][0][type]
        && content['imp'][0][type]['battr']
        && content['imp'][0][type]['battr'].indexOf(6) !== -1
    ) {
        isAttrBlocked = true;
    }
    return isAttrBlocked;
}

module.exports.createRequestObject = function(req, ssp) {
    let content = {
        id: uniqid(`${ssp.id}-`),
        tmax: 250,
        cur:[
            'USD'
        ],
        device: {},
        regs: {
            ext: {
                gdpr: req['gdpr'] || 0
            }
        },
        app: {
            cat: [],
            publisher: {
                id: 'ac1'
            }
        },
        imp: [
            {
                video: {
                    mimes:[
                        'video/mp4',
                        'video/webm',
                        'video/3gpp',
                        'application/javascript'
                    ],
                    protocols: [6],
                    maxbitrate:800,
                    minbitrate:300,
                    playbackmethod:[
                        1,
                        2
                    ],
                    minduration: 1,
                    maxduration: 999,
                },
                api: [2],
                instl: 1,
                linearity: 1,
                secure: 0,
                bidfloorcur: 'USD',
                bidfloor: 2.5,

            }
        ],
        at: 2,
        user: {},
        source: {
            ext: {
                schain: {
                    complete: 1,
                    nodes:[
                        {
                            asi: 'aceex.io',
                            sid: '1385471',
                            rid: 'c21b650c-a087-42b0-b27a-d32eec260380-9207',
                            hp: 1
                        }
                    ],
                    ver: '1.0'
                }
            }
        },
        _state: {}
    };

    if (req.ip) content.device.ip = req.ip;
    if (req.ipv6) content.device.ipv6 = req.ipv6;
    if (req.ua) content.device.ua = req.ua;
    if (req.ifa || req.gpid)  content.device.ifa = req.ifa || req.gpid;
    if (req.bundle) content.app.bundle = req.bundle;
    // if (req.cat) content.app.cat = req.cat.split(',').map(a => a.trim());
    if (req.storeurl) content.app.storeurl = req.storeurl;
    if (req.name) content.app.name = req.name;
    if (req.protocols) content.imp[0].video.protocols = req.protocols.split(',').map(a => parseInt(a.trim(), 10));
    if (req.w) content.imp[0].video.w = req.w;
    if (req.h) content.imp[0].video.h = req.h;
    if (req.yob) content.user.yob = req.yob;
    if (req.age) content.user.age = req.age;
    if (req.gender) content.user.gender = req.gender;
    if (req.education) content.user.education = req.education;
    if (req.pchain) content.source.pchain = req.pchain;

    return content;
};

module.exports.checkHasRequiredFramework = function (content, rule, type) {
    const VPAID_1 = 1;
    const VPAID_2 = 2;
    const MRAID_1 = 3;
    const ORMMA = 4;
    const MRAID_2 = 5;
    // not in 2.4 version
    // const MRAID_3 = 6;

    let hasRequiredFrameworks = false;
    let availableAPI = [];
    if (content['imp'][0][type]
        && content['imp'][0][type]['api']) {
        availableAPI = content['imp'][0][type]['api'];
    }
    switch (rule) {
        case "mraid_1":
            hasRequiredFrameworks = availableAPI.indexOf(MRAID_1) !== -1;
            break;
        case "mraid_2":
            hasRequiredFrameworks = availableAPI.indexOf(MRAID_2) !== -1;
            break;
        case "mraid_all":
            hasRequiredFrameworks = availableAPI.indexOf(MRAID_1) !== -1 || availableAPI.indexOf(MRAID_2) !== -1;
            break;
        case "no_mraid":
            hasRequiredFrameworks = availableAPI.length == 0 || (availableAPI.indexOf(MRAID_1) !== -1 && availableAPI.indexOf(MRAID_2) !== -1)
            break;
        case "all":
            hasRequiredFrameworks = true;
            break;
    }
    return hasRequiredFrameworks;
}

const getSubType = (request, devicetype, type, isCTV) => {
    switch (type) {
        case 'video':
            if (request['device'] !== undefined && isCTV) return 'ctv'
            if ((request['imp'][0][type]['skip'] === 0) ||
                (request['imp'][0][type]['ext'] !== undefined && request['imp'][0][type]['ext']['videotype'] === 'rewarded')
            ) return 'rewarded'
            break
        default:
            break
    }
    return 'all'
};

module.exports.getSubType = getSubType;

module.exports.addRequestSubtype = (type, subtype) => {
    if (subtype !== 'all' || !subtype) type += `_${subtype}`
    return formatMap[type]
}

module.exports.hashCode = function(str) {
    return str.split('').reduce(function(a,b) {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0).toString();
}

module.exports.getFraudPercent = (obj, key) => {
    return obj[key] ? obj[key]['fraud'] : undefined;
};

module.exports.streamToString = (stream, next) => {
    if (stream.headers['content-encoding'] === 'gzip' || stream.headers['content-encoding'] === 'deflate') {
        decodeGzip(stream, next)
    } else {
        let string = ''
        stream
            .on('error', next)
            .on('data', (data) => string += data)
            .on('end', () => next(null, string))
    }
}

function decodeGzip(stream, next) {
    let zipped = [];
    let byteLength = 0;
    stream
        .on('error', next)
        .on('data', (data) => {
            zipped.push(data)
            byteLength += data.length
        })
        .on('end', () => {
            if (zipped.length > 0) {
                zlib.unzip(Buffer.concat(zipped, byteLength), (error, data) => {
                    if (error) return next(error)
                    return next(null, data.toString('utf-8'))
                })
            } else return next(null, '')
        })
}
