const { copyArray } = require('../../utils');

module.exports = (defaultPmp)=>{
    const pmp = {};

    //REQUEST -> IMP -> pmp -> private_auction
    defaultPmp['private_auction'] && 
        (pmp['private_auction'] = defaultPmp['private_auction']);
    
    //REQUEST -> IMP -> pmp -> deals
    defaultPmp['private_auction'] &&
    Array.isArray(defaultPmp['deals']) && 
        (pmp['deals'] = copyArray(defaultPmp['deals']));
        
    return pmp;
};
