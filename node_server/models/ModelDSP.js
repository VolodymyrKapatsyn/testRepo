"use strict";

Object.defineProperty(exports, "__esModule", {value: true});

var Parser = /** @class */ (function () {
    function Parser(chunks, serverip) {
        this.id = parseInt(chunks[1]);
        this.company = chunks[2];
        if (chunks[3] !== 'badHost') this.badhost = chunks[3];
        this.port = parseInt(chunks[4]);
        this.tmax = parseInt(chunks[5]);
        let dsplookupip = {};
        try {
            dsplookupip = JSON.parse(chunks[6]);
        } catch (e) {
            console.log('dsplookupip', chunks[6], e);
        }
        this.host = dsplookupip[serverip] || '';
        this.usebanner = parseInt(chunks[7]);
        this.usevideo = parseInt(chunks[8]);
        this.usenative = parseInt(chunks[9]);
        this.useaudio = parseInt(chunks[10]);
        this.usevast = parseInt(chunks[11]);
        this.vastPrice = isNaN(parseFloat(chunks[12])) ? 0 : parseFloat(chunks[12]);
        try {
            this.devos = JSON.parse(chunks[13]);
        } catch (e) {
            this.devos = {};
        }
        try {
            this.conntp = JSON.parse(chunks[14]);
        } catch (e) {
            this.conntp = {};
        }
        this.maxbidfloor = +chunks[15];
        this.requserid = +chunks[16];
        this.nativeSpec = +chunks[17];
        this.reqdevid = +chunks[18];
        this.blockedcat = (chunks[19] == '' ? [] : chunks[19].split('|'));
        this.adaptraffic = +chunks[20];
        this.donocheckmalware = +chunks[21];
        try {
            this.secureprotocol = JSON.parse(chunks[22]);
        } catch (e) {
            this.secureprotocol = {};
        }
        this.reqcarrier = +chunks[23];
        try {
            this.allowedMimes = JSON.parse(chunks[24]);
        } catch (e) {
            this.allowedMimes = {};
        }
        this.reqpubid = +chunks[25];
        this.marga = parseInt(chunks[26]);
        let limits = {};
        try {
            limits = JSON.parse(chunks[27]);
        } catch (e) {
            console.log('DSPSETTERR', chunks[27], e);
        }
        this.passerLimit = limits[serverip] || 0;
        try {
            this.blockedSSP = JSON.parse(chunks[28]);
        } catch (e) {
            this.blockedSSP = {};
        }
        try {
            this.allowedSSP = JSON.parse(chunks[29]);
        } catch (e) {
            this.allowedSSP = {};
        }
        try {
            this.allowedCountries = JSON.parse(chunks[30]);
        } catch (e) {
            this.allowedCountries = {};
        }
        this.intstl = +chunks[31];
        try {
            this.trafquality = JSON.parse(chunks[32]);
        } catch (e) {
            this.trafquality = {};
        }
        this.goodtraffic = +chunks[33];
        this.filterporn = +chunks[34];
        this.matchedUsersOnly = +chunks[35];
        this.inapp = +chunks[36];
        this.desktop = +chunks[37];
        this.mobweb = +chunks[38];
        this.spendlimit = +chunks[39];
        this.dailyspend = +chunks[40];
        this.videoStartTracker = +chunks[41];
        this.adaptLearningPerc = +chunks[42];
        this.fraudPercPX = +chunks[43];
        this.at = +chunks[44];
        this.ctv = +chunks[45];
        this.rewarded = +chunks[46];
        this.schain = +chunks[47];
        this.minbidfloor = parseFloat(chunks[48]);
        this.tcf2 = parseInt(chunks[49]);
        this.coppa = parseInt(chunks[50]);
        this.ccpa = parseInt(chunks[51]);
        this.path = chunks[52];
        try {
            this.prebidPayload = JSON.parse(chunks[53]);
        } catch (e) {
            this.prebidPayload = null;
        }
        try {
            this.blockedCountries = JSON.parse(chunks[54]) || {};
        } catch (e) {
            this.blockedCountries = {};
        }
        this.passer = 0;
        this.limit = 0;
        this.sendreq = 0;

        if (chunks.length > 55) this.error = `Arguments mismatch, got ${chunks.length} chunks`;
    }

    return Parser;
}());
exports.Parser = Parser;

const dspFiltersPreCacheTypes = {
    'type': { 'usebanner': {'1': '1'}, 'usevideo': {'1': '2'}, 'usenative': {'1': '3'}, 'useaudio': {'1': '4'}},
    'platformType': {'mobweb': {'1': '1'}, 'desktop': {'1': '2'}, 'inapp': {'1': '3'}},
    'ctv': {'ctv': {'0': '5', '1': '4'}},
    'deviceId': {'reqdevid': {'0': '0,1', '1': '1'}},
    'onlyKnownApps': {'goodtraffic': {'0': '0,1', '1': '1'}},
    'os': {'allOs': {'1': '1,2,3,4,5,6'}, 'android': {'1': '1'}, 'ios': {'1': '2'}, 'linux': {'1': '3'}, 'mac os': {'1': '4'}, 'windows': {'1': '5'}}
};

module.exports.setUpDSP = (data) => {
    globalStorage.dspPartners = data;
    globalStorage.dspPreSetSettings = {};

    Object.keys(globalStorage.dspPartners).forEach((dsp) => {
        if (globalStorage.dspPartners[dsp]['passerLimit'] >= 1 && (globalStorage.dspPartners[dsp]['spendlimit'] === 0 ||
            globalStorage.dspPartners[dsp]['spendlimit'] > globalStorage.dspPartners[dsp]['dailyspend'])) {
            globalStorage.adapterIncreaseRate[dsp] = globalStorage.dspPartners[dsp]['passerLimit'] * (globalStorage.dspPartners[dsp]['adaptLearningPerc'] / 100);
            globalStorage.adapterPoints[dsp] = 1;

            globalStorage.dspPartners[dsp]['allowedSSP'].length = Object.keys(globalStorage.dspPartners[dsp]['allowedSSP']).length;
            globalStorage.dspPartners[dsp]['allowedCountries'].length = Object.keys(globalStorage.dspPartners[dsp]['allowedCountries']).length;
            globalStorage.dspPartners[dsp]['blockedCountries'].length = Object.keys(globalStorage.dspPartners[dsp]['blockedCountries']).length;
            globalStorage.dspPartners[dsp]['devos'].length = Object.keys(globalStorage.dspPartners[dsp]['devos']).length;
            globalStorage.dspPartners[dsp]['conntp'].length = Object.keys(globalStorage.dspPartners[dsp]['conntp']).length;

            //add VAST point - TEMP!!
            // if (globalStorage.dspPartners[dsp]['usevast'] === 1) return;

            //  PRE SET SETTINGS
            //Operation system
            if (globalStorage.dspPartners[dsp]['devos'].length > 0) {
                for (let os in globalStorage.dspPartners[dsp]['devos']) {
                    globalStorage.dspPartners[dsp][os] = 1
                }
            } else {
                globalStorage.dspPartners[dsp]['allOs'] = 1;
            }

            let dataIndex = [''];
            for (let filterKey in dspFiltersPreCacheTypes) {
                let newObj = [];
                for (let type in dspFiltersPreCacheTypes[filterKey]) {
                    let key = dspFiltersPreCacheTypes[filterKey][type][globalStorage.dspPartners[dsp][type]];
                    if (key !== undefined) {
                        let values = key.split(',');
                        for (let one = 0; one < values.length; one++) {
                            for (let k = 0; k < dataIndex.length; k++) {
                                newObj.push(dataIndex[k].toString() + values[one].toString());
                            }
                        }
                    }
                }
                dataIndex = newObj;
            }

            for (let i = 0; i < dataIndex.length; i++) {
                if (!globalStorage.dspPreSetSettings[dataIndex[i]]) globalStorage.dspPreSetSettings[dataIndex[i]] = [];
                if (globalStorage.dspPreSetSettings[dataIndex[i]].indexOf(dsp) === -1) {
                    globalStorage.dspPreSetSettings[dataIndex[i]].push(dsp);
                }
            }
            
            // if(!globalStorage.dspPreSetSettings[135112]){
            //     globalStorage.dspPreSetSettings[135112] = []
            // }
            //
            // if(!globalStorage.dspPreSetSettings[135101]){
            //     globalStorage.dspPreSetSettings[135101] = []
            // }

            // globalStorage.dspPreSetSettings[135112].push(dsp)
            // globalStorage.dspPreSetSettings[135101].push(dsp)

        }
    });


}
