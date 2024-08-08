const createPmpObject    = require('./create-pmp-object');
const createBannerObject = require('./create-banner-object');
const createVideoObject  = require('./create-video-object');
const createNativeObject = require('./create-native-object');
const createAudioObject  = require('./create-audio-object');
const skadnModule        = require('../../modules/skadn');

module.exports = (defaultImp, placementParams, requestAppBundle) => {
    const imp = {
        'id': placementParams.impressionId,
        'instl': (defaultImp['instl'] !== undefined ? defaultImp['instl'] : 0),
        'secure': defaultImp['secure'] || 0,
        'bidfloorcur': 'USD'
    };

    //REQUEST -> IMP -> tagid
    defaultImp['tagid'] !== undefined && (imp['tagid'] = `${defaultImp['tagid']}`);

    //REQUEST -> IMP -> ext -> skadn
    if (defaultImp['ext'] && defaultImp['ext']['skadn']) {
        const skadn = skadnModule.getValidatedSSPData(defaultImp['ext']['skadn'], requestAppBundle);
        if (skadn) imp['ext'] = {skadn};
    }

    //REQUEST -> IMP -> pmp
    defaultImp['pmp'] && (imp['pmp'] = createPmpObject(defaultImp['pmp']));

    if (defaultImp['banner'] !== undefined) {
        imp['banner'] = createBannerObject(defaultImp['banner'], placementParams)
    } else if (defaultImp['native'] !== undefined) {
        imp['native'] = createNativeObject(defaultImp['native'], placementParams)
    } else if (defaultImp['video'] !== undefined) {
        imp['video'] = createVideoObject(defaultImp['video'], placementParams)
    } else if (defaultImp['audio'] !== undefined) {
        imp['audio'] = createAudioObject(defaultImp['audio'], placementParams)
    }

    return imp;
};
