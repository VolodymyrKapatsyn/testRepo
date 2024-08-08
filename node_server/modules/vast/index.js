const macrosList = require('./macrosList.json');
const defaultMacros = require('./supplyMacrosList.json');
const Config = require('../../configs/config.json');
const crypto = require('crypto');
const library = require('../../Library.json');
const {
    addCountCoreBidQpsDSP,
} = require('../../Functions');

const re = new RegExp(Object.keys(macrosList).map(k => k.replace(/([\[\]\{\}\$])/g,'\\$1')).join('|'),'g');

const prepareVastLink = (dsp, request) => {

    let link = globalStorage.dspPartners[dsp]['path'];
    let source = request['app'] ? request['app']['bundle'] : request['site']['domain'];

    let requestDetailsCache = {
        'CACHEBUSTER': request['id'],//encodeURIComponent(crypto.createHash('md5').update(Math.random() + request['id']).digest('hex')),
        'BIDFLOOR': request['imp'][0]['bidfloor'],
        'UA': request['device']['ua'] ? encodeURIComponent(request['device']['ua']) : '',
        'IP': encodeURIComponent(request['device']['ip']),
        'IFA': request['device']['ifa'] ? encodeURIComponent(request['device']['ifa']) : '',
        'APP_NAME': request['app'] ? request['app']['name'] ? encodeURIComponent(request['app']['name']) : encodeURIComponent(request['app']['bundle']) : '',
        'APP_BUNDLE': request['app'] ? encodeURIComponent(request['app']['bundle']) : ''
    };

    try {
        link = link.replace(re, name => {
            let macrosName = macrosList[name];
            if (requestDetailsCache[macrosName] === undefined) {
                requestDetailsCache[macrosName] = _prepareMacros(macrosName, request);
            }
            return requestDetailsCache[macrosName];
        });
    } catch (e) {
        console.error('[vastEPHandler] endpoint fill error:', e);
        return 'PREPARE_ERROR';
    }

    return link;
};
module.exports.prepareVastLink = prepareVastLink;

const _prepareMacros = (macrosName, request) => {
    switch (macrosName) {
        case 'PROTOCOL':
            if (request.imp[0].video.protocols && Array.isArray(request.imp[0].video.protocols)) {
                if (request.imp[0].video.protocols.includes(2)) return 'VAST 2.0';
                if (request.imp[0].video.protocols.includes(3)) return 'VAST 3.0';
                if (request.imp[0].video.protocols.includes(5)) return 'VAST 2.0 Wrapper';
                if (request.imp[0].video.protocols.includes(6)) return 'VAST 3.0 Wrapper';
            }
        case 'PAGE_URL':
            return request['site'] ? encodeURIComponent(request['site']['page']) : '';
        case 'WIDTH':
            return request['imp'][0]['video']['w'] || 0;
        case 'HEIGHT':
            return request['imp'][0]['video']['h'] || 0;
        case 'DOMAIN':
            return request['site'] ? encodeURIComponent(request['site']['domain']) : '';
        case 'APP_ID':
            return request['app'] && request['app']['id'] ? request['app']['id'] : '';
        case 'DEVICE_TYPE':
            return request['device']['devicetype'];
        case 'DEVICE_MAKE':
            return request['device']['make'] ? encodeURIComponent(request['device']['make']) : '';
        case 'DEVICE_MODEL':
            return request['device']['model'] ? encodeURIComponent(request['device']['model']) : '';
        case 'CARRIER':
            return request['device']['carrier'] ? encodeURIComponent(request['device']['carrier']) : '';
        case 'LOCATION_LON':
            return request['device']['geo'] && request['device']['geo']['lon'] ? request['device']['geo']['lon'] : 0;
        case 'LOCATION_LAT':
            return request['device']['geo'] && request['device']['geo']['lat'] ? request['device']['geo']['lat'] : 0;
        case 'LOCATION':
            let lon = request['device']['geo'] && request['device']['geo']['lon'] ? request['device']['geo']['lon'] : 0;
            let lat = request['device']['geo'] && request['device']['geo']['lat'] ? request['device']['geo']['lat'] : 0;
            return encodeURIComponent(`${lat},${lon}`);
        case 'COUNTRY':
            return  request['device']['geo'] &&  request['device']['geo']['country'] ?  request['device']['geo']['country'] : '';
        case 'GEO_TYPE':
            return request['device']['geo'] && request['device']['geo']['type'] ? request['device']['geo']['type'] : '';
        case 'MIN_DURATION':
            return request['imp'][0]['video']['minduration'] || 0;
        case 'MAX_DURATION':
            return request['imp'][0]['video']['maxduration'] || 999;
        case 'STORE_URL':
            return request['app'] && request['app']['storeurl'] ? encodeURIComponent(request['app']['storeurl']) : '';
        case 'REF_URL':
            return request['site'] && request['site']['ref'] ? encodeURIComponent(request['site']['ref']) : '';
        case 'GDPR':
            return request['regs'] && request['regs']['ext'] && request['regs']['ext']['gdpr'] ? request['regs']['ext']['gdpr'] : 0;
        case 'CONSENT':
            return request['user'] && request['user']['ext'] && request['user']['ext']['consent'] ? encodeURIComponent(request['user']['ext']['consent']) : '0';
        case 'API':
            return request['imp'][0]['video']['api'] && Array.isArray(request['imp'][0]['video']['api']) ? request['imp'][0]['video']['api'].join(',') : '';
        case 'LMT':
            return request['device']['lmt'] || 0;
        case 'DNT':
            return request['device']['dnt'] || 0;
        case 'PUB_ID':
            let platform = request.app ? 'app' : 'site';
            let pid = '';
            if (request[platform].publisher && request[platform].publisher.id) pid = request[platform].publisher.id;
            return pid;
        case 'OS':
            return request['device']['os'] ? encodeURIComponent(request['device']['os']) : '';
        case 'OSV':
            return request['device']['osv'] ? request['device']['osv'] : '';
        case 'US_PRIVACY':
            return request['regs'] && request['regs']['ext'] && request['regs']['ext']['us_privacy'] ? request['regs']['ext']['us_privacy'] : '';
        case 'COPPA':
            return request['regs'] && request['regs']['coppa'] ? request['regs']['coppa'] : 0;
        case 'SCHAIN':
            return _getSchainStr(request);
        case 'APP_VER':
            return request['app'] && request['app']['ver'] ? encodeURIComponent(request['app']['ver']) : '';
        case 'CAT':
            let CAT = '';
            if (request['app'] && request['app']['cat']) {
                CAT = encodeURIComponent(request['app']['cat'].join(','));
            } else if(request['site'] && request['site']['cat']) {
                CAT = encodeURIComponent(request['site']['cat'].join(','));
            }
            return CAT;
        case 'USER_ID':
            return request['user'] && request['user']['id'] ? request['user']['id'] : '';
        case 'USER_YOB':
            return request['user'] && request['user']['yob'] ? request['user']['yob'] : '';
        case 'USER_GENDER':
            return request['user'] && request['user']['gender'] ? request['user']['gender'] : '';
        case 'SUB_ID':
            return '';
        case 'PROTOCOLS':
            return request.imp[0].video.protocols && Array.isArray(request.imp[0].video.protocols) ? request.imp[0].video.protocols.join(',') : '';
        case 'LANGUAGE':
            return request['device']['language'] ? request['device']['language'] : '';
        case 'CONNECTION_TYPE':
            return request['device']['connectiontype'] ? request['device']['connectiontype'] : '';
        case 'ENCODED_URL_GOES_HERE':
            return request.site && request.site.domain ? encodeURIComponent(`https://${request.site.domain}`) : '';
        case 'AD_POSITION':
            return request['imp'][0]['video']['pos'] != null ? request['imp'][0]['video']['pos'] : '';
        case 'IFA_SHA1':
            let ifasha1 = '';
            if (request['device']['didsha1'] || request['device']['dpidsha1']) ifasha1 = request['device']['didsha1'] || request['device']['dpidsha1'];
            else if (request['device']['ifa']) ifasha1 = crypto.createHash('sha1').update(request['device']['ifa']).digest('hex');
            return ifasha1;
        case 'IFA_MD5':
            let ifamd5 = '';
            if (request['device']['dpidmd5'] || request['device']['didmd5']) ifamd5 = request['device']['dpidsha1'] || request['device']['didmd5'];
            else if (request['device']['ifa']) ifamd5 = crypto.createHash('md5').update(request['device']['ifa']).digest('hex');
            return ifamd5;
        case 'CITY':
            return request['device']['geo'] && request['device']['geo']['city'] ? request['device']['geo']['city'] : '';
        case 'ZIP':
            return request['device']['geo'] && request['device']['geo']['zip'] ? request['device']['geo']['zip'] : '';
        case 'METRO':
            return request['device']['geo'] && request['device']['geo']['metro'] ? request['device']['geo']['metro'] : '';
        case 'IMP_ID':
            return request['imp'][0]['id'];
        case 'CONTENT_TITLE':
            return '';
        case 'JS':
            return request['device'] && Number.isInteger(request['device']['js']) ? request['device']['js'] : '';
        case 'SECURE':
            return request.imp[0].secure || 0;
        case 'PLACE':
            if (request.imp[0].video.hasOwnProperty('startdelay') && request.imp[0].video.startdelay > 0) {
                return 3;
            } else return 4;
        case 'BRAND':
            if (request.device.make) return encodeURIComponent(request.device.make);
            else return '[BRAND]';
        default:
            throw new Error('Unknown macros name:' + macrosName);
    }
}

const _getSchainStr = (bidRequest) => {
    const SCHAIN = [];
    let platform = bidRequest.app ? 'app' : 'site';
    let pubId = '';
    if (bidRequest[platform].publisher && bidRequest[platform].publisher.id) pubId = bidRequest[platform].publisher.id;
    const ownScain = `!aceex.io,${pubId},1,${bidRequest.id},,`
    let schainObject = null;
    if (bidRequest['ext'] && bidRequest['ext']['schain']) {
        schainObject = bidRequest['ext']['schain'];
    } else if (bidRequest['source'] && bidRequest['source']['ext'] && bidRequest['source']['ext']['schain']) {
        schainObject = bidRequest['source']['ext']['schain'];
    }

    let ver = schainObject && schainObject['ver'] ? schainObject['ver'] : '1.0';
    let complete = schainObject && schainObject['complete'] ? schainObject['complete'] : 0;
    SCHAIN.push(`${ver},${complete}`);

    if (schainObject !== null) {
        let nodes = schainObject['nodes'] && Array.isArray(schainObject['nodes']) ? schainObject['nodes'] : [];
        for (let i = 0, len = nodes.length; i < len; i++) {
            const item = nodes[i];
            const asi = item['asi'] ? item['asi'] : '';
            const domain = item['domain'] ? item['domain'] : '';
            const name = item['name'] ? item['name'] : '';
            const hp = item['hp'] ? item['hp'] : '';
            const rid = item['rid'] ? item['rid'] : '';
            const sid = item['sid'] ? item['sid'] : '';
            SCHAIN.push(`!${asi},${sid},${hp},${rid},${name},${domain}`);
        }
    }
    return `${SCHAIN.join('')}${ownScain}`;
}

module.exports.getVastBid = (request, sspPartner, reqResStorage, vastDSP) => {
    if (vastDSP.length === 0) return {};
    let rand = Math.floor(Math.random() * vastDSP.length);
    const dsp = vastDSP[rand];
    const ourcrid = crypto.createHash('md5').update(`${dsp.company}_${dsp.id}`).digest('hex');
    const link = `${globalStorage.dspPartners[dsp]['port'] === 80 ? 'http' : 'https'}://${globalStorage.dspPartners[dsp]['badhost']}${prepareVastLink(dsp, request)}`;
    const adm = `<?xml version="1.0" encoding="UTF-8"?><VAST version="2.0"><Ad id="${encodeURIComponent(crypto.createHash('md5').update(Math.random() + request.id).digest('hex'))}"><Wrapper><AdSystem><![CDATA[Aceex]]></AdSystem><VASTAdTagURI><![CDATA[${link}]]></VASTAdTagURI><Impression></Impression></Wrapper></Ad></VAST>`

    const response = {
        isVast: true,
        dsp: dsp,
        bf: request.imp[0].bidfloor,
        margin: globalStorage.dspPartners[dsp].marga,
        newcrid: ourcrid,
        data: {
            id: request.id,
            seatbid: [
                {
                    bid: [
                        {
                            id: `${ourcrid}`,
                            impid: '1',
                            price: globalStorage.dspPartners[dsp].maxbidfloor,
                            w: request.imp[0].video.w,
                            h: request.imp[0].video.h,
                            adomain: [library.RandomAdomains[Math.floor(Math.random() * (library.RandomAdomains.length - 1))]],
                            adm: adm,
                            adid: '8ccb4cf76cfc',
                            cid: `${globalStorage.dspPartners[dsp]['id']}`,
                            crid: `${globalStorage.dspPartners[dsp]['id']}`
                        }
                    ],
                    seat: `${globalStorage.dspPartners[dsp]['id']}`
                }
            ],
            cur: 'USD'
        }
    }

    addCountCoreBidQpsDSP(dsp);
    reqResStorage.save('bidResponse', globalStorage.dspPartners[dsp]['id'], response['data']);

    return response;
}

module.exports.vastSupplyTransform = (requestPath, supplyPartner) => {
    let device = {};
    let source = {};
    let regs = {};
    let user = {};

    let replaceObjectList = [
        {path: 'ip', rtb: 'ip'},
        {path: 'ifa', rtb: 'ifa'},
        {path: 'ua', rtb: 'ua'},
        {path: 'dnt', rtb: 'dnt'},
        {path: 'device_make', rtb: 'make'},
        {path: 'device_model', rtb: 'model'},
    ];

    for (let replaceObject of replaceObjectList) {
        if (
            requestPath[replaceObject['path']] &&
            requestPath[replaceObject['path']] !== defaultMacros[replaceObject['path']]
        ) {
            device[replaceObject['rtb']] = requestPath[replaceObject['path']]
        }
    }

    if (requestPath['coppa'] && requestPath['coppa'] !== defaultMacros['coppa']) regs['coppa'] = requestPath['coppa'];

    if (requestPath['gdpr'] && requestPath['gdpr'] !== defaultMacros['gdpr']) {
        regs['ext'] = {
            'gdpr': requestPath['gdpr']
        }
    }

    if (requestPath['ccpa'] && requestPath['ccpa'] !== defaultMacros['ccpa']) {
        if (regs['ext'] === undefined) {
            regs['ext'] = {
                'us_privacy': requestPath['ccpa']
            }
        } else {
            regs['ext']['us_privacy'] = requestPath['ccpa'];
        }
    }

    if (
        (requestPath['location_lat'] && requestPath['location_lat'] !== defaultMacros['location_lat']) ||
        (requestPath['location_lon'] && requestPath['location_lon'] !== defaultMacros['location_lon'])
    ) {
        device['geo'] = {};
        if (requestPath['location_lat'] && requestPath['location_lat'] !== defaultMacros['location_lat'] && !isNaN(parseFloat(requestPath['location_lat']))) {
            device['geo']['lat'] = parseFloat(requestPath['location_lat'])
        }
        if (requestPath['location_lon'] && requestPath['location_lon'] !== defaultMacros['location_lon'] && !isNaN(parseFloat(requestPath['location_lon']))) {
            device['geo']['lon'] = parseFloat(requestPath['location_lon'])
        }
    }

    if (requestPath['user_id'] && requestPath['user_id'] !== defaultMacros['user_id']) {
        user['id'] = requestPath['user_id'];
        if (requestPath['gdpr_consent'] && requestPath['gdpr_consent'] !== defaultMacros['gdpr_consent']) {
            user['ext'] = {
                'consent': requestPath['gdpr_consent']
            }
        }
    }

    if (requestPath['domain'] && requestPath['domain'] !== defaultMacros['domain']) {
        source = {site: {domain: requestPath['domain']}};
        if (requestPath['page_url'] || requestPath['page_url'] !== defaultMacros['page_url']) source['site']['page'] = requestPath['page_url']
    }

    if (requestPath['app_bundle'] && requestPath['app_bundle'] !== defaultMacros['app_bundle']) {
        source = {app: {bundle: requestPath['app_bundle']}};
        if (requestPath['app_name'] && requestPath['app_name'] !== defaultMacros['app_name']) source['app']['name'] = requestPath['app_name'];
        if (requestPath['app_store_url'] && requestPath['app_store_url'] !== defaultMacros['app_store_url']) source['app']['storeurl'] = requestPath['app_store_url'];
        if (requestPath['category'] && requestPath['category'] !== '' && requestPath['category'] !== defaultMacros['category']) source['app']['cat'] = requestPath['category'].split(",");
    }

    let uriBidfloor ;

    if (requestPath['bidfloor'] && requestPath['bidfloor'] !== defaultMacros['bidfloor'] && !isNaN(parseFloat(requestPath['bidfloor']))) {
        uriBidfloor = parseFloat(requestPath['bidfloor']);
    }

    let reqid = crypto.randomBytes(16).toString('hex');
    let bidfloor = uriBidfloor || Math.max(supplyPartner['minbfloor'], Config['minbidfloor']['video']);
    let tmax =  supplyPartner['tmax'] || 300;
    let imp =
        [
            {
                id: crypto.randomBytes(16).toString('hex'),
                tagid : requestPath['placement_id'] && requestPath['placement_id'] !== defaultMacros['placement_id'] ?  requestPath['placement_id'] : '',
                video: {
                    mimes: ['video/mp4', 'video/webm', 'video/3gpp']
                },
                bidfloor: bidfloor
            }
        ];

    let replaceImpObjectList = [
        {path: 'width', rtb: 'w'},
        {path: 'height', rtb: 'h'},
        {path: 'minimum_duration', rtb: 'minduration'},
        {path: 'maximum_duration', rtb: 'maxduration'}
    ];

    for (let replaceImpObj of replaceImpObjectList) {
        if (
            requestPath[replaceImpObj['path']] &&
            requestPath[replaceImpObj['path']] !== defaultMacros[replaceImpObj['path']] &&
            !isNaN(parseInt(requestPath[replaceImpObj['path']])))
        {
            imp[0]['video'][replaceImpObj['rtb']] = parseInt(requestPath[replaceImpObj['path']]);
        }
    }


    return {id: reqid, device, ...source, imp, tmax, user, regs}
}
