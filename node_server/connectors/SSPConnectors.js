"use strict";

const Blowfish          = require('blowfish');
const googleDecrypt     = require('../libs/google/decrypt_google_price.js');
const crypto            = require('crypto');
const config            = require('../configs/config.json');

function decodeAesCbc(price, encryption_key){

    let algorithm = 'aes-256-cbc';
    let iv = new Buffer(16);
    let decipher = crypto.createDecipheriv(algorithm, encryption_key.toString('binary'), iv);
    decipher.setAutoPadding(false);

    let dec = decipher.update(price,'hex','utf8');
    dec += decipher.final('utf8');
    let finalPrice = parseFloat(dec.slice(-16));
    // let finalPrice = parseFloat(price_str.replace(/[0]+$/, ""));
    return finalPrice;
}

module.exports.modifySSPFinalResponse = (ssp, dsp, objResponse, impPixel) => {
    return true;
}

//////////////
module.exports.checkForEncodedPrice = (sspName, pr) => {
    if (!pr) return '';
    let price;

    switch (sspName) {
        default:
            price = parseFloat(pr);
            break;
    }
    return price;
};

module.exports.pubIdModify = function(sspName, pubid){
    return pubid;
};

module.exports.updatePopRequest = (req, isPop) => {
    if (isPop && req['imp'] !== undefined && req['imp'][0] !== undefined) {
        req['imp'][0]['ext'] || (req['imp'][0]['ext'] = {});
        req['imp'][0]['ext']['type'] = 'pop';
        req['imp'][0]['banner'] || (req['imp'][0]['banner'] = {});
        req['imp'][0]['banner']['w'] = 1;
        req['imp'][0]['banner']['h'] = 1;
    }
    return true;
};

module.exports.modifyAudioRequestEachSSP = (sspName, objRequest) => {
    return true;
};

module.exports.checkSSPEndpointRequirements = (dspResponse, sspPartner, type) => {
    //ASK VOVA: Do we use it?
    switch (sspPartner['company']) {
        /*
        case 'smaato':
            if (dspResponse.data.seatbid[0].bid[0].adomain && /myntra|lazada/ig.test(dspResponse.data.seatbid[0].bid[0].adomain)) return false;
            break;
        */
        default:
            break;
    }
    return true;
};

module.exports.checkVideoSSPRequirements = (dspResponse, sspPartner, dspName, sspRequest) => {
    if (/<VAST>/.test(dspResponse.data.seatbid[0].bid[0].adm)) {
        dspResponse.data.seatbid[0].bid[0].adm = dspResponse.data.seatbid[0].bid[0].adm.replace('VAST', 'VAST version="2.0"');
    }
    return true;
};
