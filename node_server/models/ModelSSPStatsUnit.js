'use strict';

const config        = require('../configs/config.json');
const Functions     = require(`../Functions`);
const SSP_INFO_KEYS = config.sspInfoKeys;

const platfomMap = {
    'platform': 1,
    'macos': 2,
    'windows': 3,
}

const getReqDevTypeMap = {
    'none': 0,
    'desktopApp': 1,
    'desktopWeb': 2,
    'tabletApp': 3,
    'tabletWeb': 4,
    'mobileApp': 5,
    'mobileWeb': 6,
}

const getReqDevType = (isApp, deviceType) => {
    if (!deviceType || deviceType === 0) return 'none';
    let t = isApp ? 'App' : 'Web';
    switch (deviceType) {
        case 2:
            return `desktop${t}`;
        case 5:
            return `tablet${t}`;
        default:
            return `mobile${t}`;
    }
}

class SSPStatsUnitModel {

    constructor(source, ssp, dsp, pid, format, width, height, country, subtype, isApp, deviceType, crid, status) {
        this.source = source;
        this.ssp = ssp;
        this.dsp = dsp;
        this.pid = pid;
        this.format = format;
        this.width = width;
        this.height = height;
        this.country = country;
        this.subtype = subtype;
        this.isApp = isApp;
        this.deviceType = deviceType;
        this.crid = crid;
        this.status = status;
    }

    getRequestDimensionsArray() {
        let reqType = Functions.addRequestSubtype(this.format, this.subtype) || 0;
        let reqDevType = getReqDevTypeMap[getReqDevType(this.isApp, this.deviceType)] || 0;
        this.width = this.width <= 0 || typeof this.width != 'number' ? 0 : this.width;
        this.height = this.height <= 0 || typeof this.height != 'number' ? 0 : this.height;

        return [
            this.ssp || 0,
            this.dsp || 0,
            this.pid,
            this.source || 's',
            reqType,
            this.width,
            this.height,
            this.country || 'c',
            this.isApp,
            reqDevType,
            this.crid || 'c'
        ];
    }

    setStatus(status) {
        this.status = status;
    }

    setDSPid(id) {
        this.dsp = id;
    }

    setCrid(crid) {
        this.crid = crid;
    }
}

module.exports = SSPStatsUnitModel
