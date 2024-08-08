const { siteAppPublisherIdModify } = require('../../Functions');

module.exports = (sspid, platform, type)=>{
    return {
        id: siteAppPublisherIdModify(sspid, {[type]: platform}, type)
    };
};