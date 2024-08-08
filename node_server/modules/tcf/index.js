const validator = require('./validator');
const anonymizer = require('./anonymizer');

const needToAnonymize = (country, consent) => {
    return validator.needAnonymizeDataByCountry(country) && validator.needAnonymizeDataByConsentString(consent);
};

const anonymyzeData = bidRequest => {
    return  anonymizer.anonymizeData(bidRequest);
};

const applyTCF2 = bidRequest => {
    const country =  bidRequest["device"]['geo'] && bidRequest["device"]['geo']['country'] ? bidRequest["device"]['geo']['country'] : undefined;
    let consentString = '';
    if(bidRequest['user']['ext'] && bidRequest['user']['ext']['consent']) {
        consentString = bidRequest['user']['ext']['consent']
    }

    if(!country || needToAnonymize(country, consentString)) return anonymyzeData(bidRequest);
    return bidRequest
};

module.exports.applyTCF2 = applyTCF2;
module.exports.anonymizeData = anonymizer.anonymizeData;
