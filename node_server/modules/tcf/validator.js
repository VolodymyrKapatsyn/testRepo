const {TCString} = require('@iabtcf/core');
//https://vendorlist.consensu.org/v2/vendor-list.json
const PORPUSELIST = new Set([1,2,3,4,7,10]);

const GDPR_COUNTRIES = ['AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC',
    'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE',
    'GBR',  'ISL', 'LIE', 'NOR'];

const needAnonymizeDataByCountry = country => GDPR_COUNTRIES.indexOf(country) !== -1;

module.exports.needAnonymizeDataByCountry = needAnonymizeDataByCountry;

const needAnonymizeDataByConsentString = consent => {
    let myTCModel;
    try {
        myTCModel = TCString.decode(consent);
    } catch (e) {
        return true
    }
    return !isSuperset(intersection(myTCModel.purposeConsents,myTCModel.purposeLegitimateInterests), PORPUSELIST);
};

function intersection(setA, setB) {
    let _intersection = new Set();
    for (let elem of setB) {
        if (setA.has(elem[0])) {
            _intersection.add(elem[0]);
        }
    }
    return _intersection;
}

function isSuperset(set, subset) {
    for (let elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}

module.exports.needAnonymizeDataByConsentString = needAnonymizeDataByConsentString;
