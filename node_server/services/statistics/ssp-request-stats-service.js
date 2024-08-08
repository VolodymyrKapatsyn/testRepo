const config            = require('../../configs/config.json');
const Functions         = require('../../Functions')
const REGION            = require('../../configs/serverconfig').region
const SSPStatsUnitModel = require('../../models/ModelSSPStatsUnit');
const topic             = config.kafka[REGION].TOPIC;
const fs                = require('fs');

let data = '';
let isEnabled = config.enableSSPInfo;
let delimiter = '\t';
let requestObject = {};

const udpData = (key, idx, value = 1) => {
    if (requestObject[key] === undefined) {
        requestObject[key] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        requestObject[key][idx] = value;
    } else {
        requestObject[key][idx] += value;
    }
};

const generateKey = (requestDimensions) => {
    return requestDimensions.join(delimiter);
};

const incrementSSPInfoStatus = (requestDimensions, status) => {
    if (!isEnabled) return;
    incrementSSPInfoStatusWithValue(requestDimensions, status, 1);
};

module.exports.incrementSSPInfoStatus = incrementSSPInfoStatus;

const incrementSSPInfoStatusWithValue = (requestDimensions, status, value = 1) => {
    if (!isEnabled) return;
    udpData(generateKey(requestDimensions), status, value);
};

module.exports.incrementSSPInfoStatusWithValue = incrementSSPInfoStatusWithValue;

const countRequestsFromSSP = (content, platformType, ssp, status) => {
    if (!isEnabled) return;
    let country = '';
    let width = 0;
    let height = 0;

    let impObj = content['imp'][0];
    let format = '';

    let isApp = platformType === 'app' ? 1 : 0;
    if (impObj.banner) {
        format = 'banner';
    } else if (impObj.native) {
        format = 'native';
    } else if (impObj.video) {
        format = 'video';
    } else if (impObj.audio) {
        format = 'audio';
    }

    let devicetype = getDeviceType(content['device']);
    let isCTV = [3, 6, 7].includes(devicetype);
    let subtype = Functions.getSubType(content, devicetype, format, isCTV);
    let source = isApp === 1 ? content['app']['bundle'] : content['site']['domain'];
    let publisherId = content[platformType]['publisher']?.['id'] || 'none';

    switch (format) {
        case 'banner':
        case 'video':
            width = parseInt(impObj[format]['w']) || 0;
            height = parseInt(impObj[format]['h']) || 0;
            break;
        default:
            break;
    };

    if (content.device && content.device.geo && content.device.geo.country) {
        country = content.device.geo.country;
    }

    if (source === 'com.truecaller' && platformType === 'site') {
        fs.appendFile('/nodejs/node_logs/truecaller.log',ssp.id+'            '+JSON.stringify(content)+'\n',(err)=>{});
        console.log('truecaller', format, devicetype, platformType)
    }

    const sspStatUnit = new SSPStatsUnitModel(
        source,
        ssp.id,
        0,
        publisherId,
        format,
        width,
        height,
        country,
        subtype,
        isApp,
        devicetype,
        'crid',
        status
    );

    udpData(generateKey(sspStatUnit.getRequestDimensionsArray()), status);
};

module.exports.countRequestsFromSSP = countRequestsFromSSP;

const getDeviceType = (device) => {
    if (device && device['devicetype']) return device['devicetype'];
    return 0;
};

const disableSSPinfo = () => {
    isEnabled = false;
    data = '';
};

module.exports.disableSSPinfo = disableSSPinfo;

const storeResults = (producer) => {
    let statisticsKeys = Object.keys(requestObject);
    let statisticsKeysLength = statisticsKeys.length;
    if (!isEnabled || !producer.isConnected() || (statisticsKeysLength === 0)) return;
    let updates = '';
    let date = new Date().toISOString().split('T')[0];

    for (let idx = 0; idx < statisticsKeysLength; idx++) {
        let key = statisticsKeys[idx];
        updates += `${key}${delimiter}${requestObject[key].join(delimiter)}${delimiter}${date}\n`;
    }

    let payload = Buffer.from(updates)
    try {
        requestObject = {}
        producer.produce(topic, null, payload, null, Date.now());
        producer.flush(100)
        producer.poll()
    } catch (err) {
        disableSSPinfo()
        producer.disconnect();
        console.error('A problem occurred when sending our message');
        console.error(err);
    }
};

module.exports.storeResults = storeResults;
