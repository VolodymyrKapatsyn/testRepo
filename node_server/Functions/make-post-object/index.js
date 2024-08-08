const createUserObject  = require('./create-user-object');
const createImpObject   = require('./create-imp-object');
const Library           = require('../../Library.json');

module.exports = (request, placementParams, partnerId) => {
    const postDataObject = {
        'id' : placementParams['requestId'],
        'tmax': request['tmax'],
        'at': 2,
        'cur': ['USD'],
        'device': placementParams['device'],
        'ext':{
            'partnerid': partnerId
        }
    };

    //REQUEST -> site / app
    postDataObject[placementParams['platformType']] = placementParams['siteApp'];

    //REQUEST -> IMP
    if (request['imp'] && request['imp'][0]) {
        postDataObject['imp'] = [
            createImpObject(
                request['imp'][0],
                placementParams,
                request['app'] && typeof request['app'] === 'object' && request['app']['bundle'],
            )
        ];
    }

    //REQUEST -> badv
    request['badv'] !== undefined && Array.isArray(request['badv']) && request['badv'].length > 0 && (postDataObject['badv'] = request['badv']);

    //REQUEST -> bcat
    placementParams['bcat'] && placementParams['bcat'].length > 0 && (postDataObject['bcat'] = placementParams['bcat']);

    //REQUEST -> user
    postDataObject['user'] = createUserObject(request['user'], placementParams['userId']);

    //REQUEST -> regs
    if (request['regs']) {
        postDataObject['regs'] = {};
        if (request['regs']['ext']) {
            postDataObject['regs']['ext'] = {};
            if (request['regs']['ext']['gdpr'] !== undefined) {
                postDataObject['regs']['ext']['gdpr'] = Library.GDPRCountries[placementParams['device']['geo']['country']] ? Library.GDPRCountries[placementParams['device']['geo']['country']] : parseInt(request['regs']['ext']['gdpr']) || 0;
            }
            if (request['regs']['ext']['us_privacy'] !== undefined) {
                postDataObject['regs']['ext']['us_privacy'] = request['regs']['ext']['us_privacy'];
            }
        }
        request['regs']['coppa'] !== undefined && (postDataObject['regs']['coppa'] = request['regs']['coppa']);
    }

    //REQUEST -> source.ext.schain
    request['source'] && (postDataObject['source'] = Object.assign({}, request['source']));

    return postDataObject;
};
