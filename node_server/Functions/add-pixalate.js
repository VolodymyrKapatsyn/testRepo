const crypto = require('crypto');

const _getStringParam = (params, separator) => {
    let str = '';
    for (let key in params) {
        if (params[key] !== undefined) {
            str += `${key}=${params[key]}${separator}`;
        }
    }

    return str.slice(0, str.length - 1);
};

module.exports = (request, response, ext, traffic, company, country) => {
    let pixel = '';
    let macros = {};
    let separator = '&';
    let size = traffic === 'native' ? '0x0' : `${request['imp'][0][traffic]['w']}x${request['imp'][0][traffic]['h']}`;
    let ts = new Date().getTime();

    switch (traffic) {
        case 'banner':
            pixel = `<img alt = '' width='1' height='1' src='https://adrta.com/i?clid=gta&[STRING]'></img>`;
            // pixel = `<script type='text/javascript' src='https://q.adrta.com/s/gta/aa.js?cb=${encodeURI(crypto.createHash('md5').update(Math.random() + request['id']).digest('hex'))}#gta;[STRING]'></script>`;
            break;
        case 'native':
            pixel = `https://adrta.com/i?clid=gta&dvid=v&[STRING]`;
            break;
        case 'video':
            pixel = `<Impression><![CDATA[https://adrta.com/i?clid=gta&dvid=v&[STRING]]]></Impression>`;
            break;
        default:
            break;
    }

    macros.paid = 'gta'; //client identifier
    macros.avid = globalStorage.dspPartners[response['dsp']]['id']; //dsp ID
    macros.caid = encodeURI(response['data']['seatbid'][0]['bid'][0]['cid'] || response['data']['seatbid'][0]['bid'][0]['crid']); //cid
    macros.plid = encodeURI(response['data']['seatbid'][0]['bid'][0]['crid'] || 'null'); //crid
    macros.publisherId = encodeURI(ext.pubId); //pubId
    macros.siteId = encodeURI(ext.siteId); //siteId
    macros.priceBid = response['data']['seatbid'][0]['bid'][0]['price'];//bid price
    macros.kv1 = size; //size
    macros.kv2 = encodeURIComponent(request['site'] ? request['site']['domain'] : 'null'); //domain
    macros.kv3 = encodeURI(globalServices.userSync.getUserId(request)); //user ID
    macros.kv4 = request['device']['ip']; //IP
    macros.kv5 = 'a'; // platform identifier
    macros.kv6 = encodeURI(ext.source); //Source
    macros.kv7 = company; //company
    macros.kv10 = request['device']['carrier'] ? escape(request['device']['carrier']) : 'null'; //isp
    macros.kv11 = crypto.createHash('md5').update(`${1000*ts*Math.random()}${request['id']}`).digest('hex').substr(0, 20); //aucId
    macros.kv12 = encodeURI(request['imp'][0]['tagid'] !== undefined ? request['imp'][0]['tagid'] : crypto.createHash('md5').update(ext.source + ext.pubId).digest('hex').substr(15));
    macros.kv15 = country; //country
    macros.kv16 = request['device']['geo'] && request['device']['geo']['lat'] ? request['device']['geo']['lat'] : 0; //lat
    macros.kv17 = request['device']['geo'] && request['device']['geo']['lon'] ? request['device']['geo']['lon'] : 0; //lon
    macros.kv18 = encodeURI(request['app'] ? request['app']['bundle'] : 'null');
    macros.kv19 = request['device']['ifa'] ? encodeURI(request['device']['ifa']) : 'null'; //IFA
    macros.kv23 = request['device']['carrier'] ? escape(request['device']['carrier']) : 'null'; //isp
    macros.kv24 = `${(request['app'] ? 'MobileInApp' : ext.trafftype === 1 ? 'MobileWeb' : 'Desktop')}_${traffic}`//type
    macros.kv25 = escape(request['app'] ? request['app']['name'] ? request['app']['name'] : request['app']['bundle'] : request['site']['domain']); //name
    macros.kv26 = request['device']['os'] ? encodeURI(request['device']['os']) : 'null'; //OS
    macros.kv27 = request['device']['ua'] ? encodeURI(request['device']['ua']) : 'null'; //UA
    macros.kv28 = request['device']['make'] || request['device']['model'] ? encodeURI(`${request['device']['make']}_${request['device']['model']}`) : '{{DEVICE_MAKE}}_{{DEVICE_MODEL}}'; //deviceModel

    let paramString = _getStringParam(macros, separator);

    return pixel.replace('[STRING]', paramString);
};
