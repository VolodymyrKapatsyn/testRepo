'use strict';

const IPv6Parser     = require('ip-address').Address6;
const Functions      = require('./Functions');
const uaParser       = require('ua-parser-js');
const { app, site }  = require('./modules');

module.exports.device = function (request) {
    let device = {
        'dnt': (request['device']['dnt'] !== undefined && request['device']['dnt'] == '1' ? 1 : 0),
        'lmt': (request['device']['lmt'] !== undefined && request['device']['lmt'] == '1' ? 1 : 0),
        'geo': {}
    };

    if ((request['device']['ipv6'] && !request['device']['ip']) || (request['device']['ip'] && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(request['device']['ip']) === false)) {
        let originalIp = request['device']['ipv6'] || request['device']['ip'];
        let ipv6 = new IPv6Parser(originalIp);
        if (ipv6.isValid() !== true) return false;
        request['device']['ip'] = ipv6.inspectTeredo().client4;
        request['tmax'] -= 10;
    }

    let objDeviceGeo = Functions.deviceGeoModify(request);
    if (objDeviceGeo === false || objDeviceGeo['country'] === '') return false;

    Functions.deviceGeoRegionModify(objDeviceGeo);

    let devicetype = 1;
    let os = '';
    let osv = '';
    let deviceVendor = '';
    let deviceModel = '';

    try {
        request['device']['ua'] = decodeURIComponent(request['device']['ua'].replace(/%/g, ' '));
        let uaObj = uaParser(request['device']['ua']);
        devicetype = Functions.checkIsMobile(request, uaObj, request['device']['ua']);
        os = Functions.deviceOsModify(request, uaObj);
        osv = Functions.deviceOsVersionModify(request, uaObj);
        (uaObj['device']['vendor'] ? deviceVendor = uaObj['device']['vendor'] : '');
        (uaObj['device']['model'] ? deviceModel = uaObj['device']['model'] : '');
    } catch (e) {
        return false;
    }

    if (deviceVendor === '' && request['device']['make'] && request['device']['make'] !== '' && request['device']['make'].toLowerCase() !== 'unknown'){
        deviceVendor = request['device']['make'];
    }
    if (deviceModel === '' && request['device']['model'] && request['device']['model'] !== '' && request['device']['model'].toLowerCase() !== 'unknown'){
        deviceModel = request['device']['model'];
    }

    let carrier = Functions.deviceCarrierModify(request); //Carrier name or ''
    let ifa = Functions.deviceIfaModify(request); //Device id or ''

    if (ifa !== '') device['ifa'] = (request['device']['os'] == 'ios') ? ifa.toUpperCase() : ifa.toLowerCase();

    device['connectiontype'] = Functions.deviceConnectionTypeModify(request);
    device['language'] = request['device']['language'];
    if (deviceModel !== '') device['model'] = deviceModel;
    if (deviceVendor !== '') device['make'] = deviceVendor;
    if (carrier !== '') device['carrier'] = carrier;
    if (request['device']['dpidsha1'] !== undefined && request['device']['dpidsha1'] !== '') device['dpidsha1'] = request['device']['dpidsha1'];
    if (request['device']['didsha1'] !== undefined && request['device']['didsha1'] !== '') device['didsha1'] = request['device']['didsha1'];
    if (request['device']['dpidmd5'] !== undefined && request['device']['dpidmd5'] !== '') device['dpidmd5'] = request['device']['dpidmd5'];
    if (request['device']['didmd5'] !== undefined && request['device']['didmd5'] !== '') device['didmd5'] = request['device']['didmd5'];
    if (request['device']['hwv'] !== undefined && request['device']['hwv'] !== '') device['hwv'] = request['device']['hwv'];
    if (request['device']['pxratio'] !== undefined) device['pxratio'] = request['device']['pxratio'];
    if (request['device']['ppi'] !== undefined) device['ppi'] = request['device']['ppi'];
    if (request['device']['geofetch'] !== undefined) device['geofetch'] = request['device']['geofetch'];
    if (request['device']['mccmnc'] !== undefined) device['mccmnc'] = request['device']['mccmnc'];

    device['os'] = os;
    if (osv !== '') device['osv'] = osv;

    device['js'] = parseInt(request['device']['js']) || 1;
    device['ua'] = request['device']['ua'];

    if (request['device']['ipv6'] !== undefined && request['device']['ipv6'] !== '') device['ipv6'] = request['device']['ipv6'];
    if (request['device']['ip'] !== undefined && request['device']['ip'] !== '') device['ip'] = request['device']['ip'];
    if (request['device']['w'] !== undefined && request['device']['w'] !== '') device['w'] = +request['device']['w'];
    if (request['device']['h'] !== undefined && request['device']['h'] !== '') device['h'] = +request['device']['h'];

    if (devicetype) device['devicetype'] = devicetype;
    else if (request['device']['devicetype'] !== undefined) device['devicetype'] = +request['device']['devicetype'];
    // if (request['device']['devicetype'] != undefined) {device['devicetype'] = +request['device']['devicetype'];}
    // else {device['devicetype'] = devicetype;}

    device['geo']['country'] = objDeviceGeo['country'];
    if (objDeviceGeo['type'] !== undefined && objDeviceGeo['type'] !== '') device['geo']['type'] = objDeviceGeo['type'];
    if (objDeviceGeo['lat'] !== undefined && objDeviceGeo['lat'] !== 0.0) device['geo']['lat'] = objDeviceGeo['lat'];
    if (objDeviceGeo['lon'] !== undefined && objDeviceGeo['lon'] !== 0.0) device['geo']['lon'] = objDeviceGeo['lon'];
    if (objDeviceGeo['region'] !== undefined && objDeviceGeo['region'] !== '') device['geo']['region'] = objDeviceGeo['region'];
    if (objDeviceGeo['city'] !== undefined && objDeviceGeo['city'] !== '') device['geo']['city'] = objDeviceGeo['city'];
    if (objDeviceGeo['metro'] !== undefined && objDeviceGeo['metro'] !== '') device['geo']['metro'] = objDeviceGeo['metro'];
    if (objDeviceGeo['zip'] !== undefined && objDeviceGeo['zip'] !== '') device['geo']['zip'] = objDeviceGeo['zip'];
    if (objDeviceGeo['utcoffset'] !== undefined) device['geo']['utcoffset'] = objDeviceGeo['utcoffset'];
    if (objDeviceGeo['accuracy'] !== undefined && objDeviceGeo['accuracy'] != 0) device['geo']['accuracy'] = objDeviceGeo['accuracy'];

    return device;
};

module.exports.app = app;
module.exports.site = site;
