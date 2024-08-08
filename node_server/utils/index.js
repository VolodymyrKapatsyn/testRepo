const suppWrapperProtocols = [4, 5, 6, 8];
const vastProtocols = {
    4: '1.0',
    5: '2.0',
    6: '3.0',
    8: '4.0'
};
const vastDescToProtocol = {
    'VAST 1.0': 1,
    'VAST 2.0': 2,
    'VAST 3.0': 3,
    'VAST 1.0 Wrapper': 4,
    'VAST 2.0 Wrapper': 5,
    'VAST 3.0 Wrapper': 6,
    'VAST 4.0': 7,
    'VAST 4.0 Wrapper': 8,
    'DAAST 1.0': 9,
    'DAAST 1.0 Wrapper': 10
};
const versionRegex = /(?<TYPE>VAST|DAAST).*?version="(?<VERSION>\d\.?\d?)"/;


const copyArray = (oldArray)=>{
    const newArray = [];
    let currentIndex = oldArray.length - 1;
    for(currentIndex; currentIndex >= 0; currentIndex--)
        newArray[currentIndex] = copyObject(oldArray[currentIndex]);
    return newArray;
}

const copyObject = (oldObject)=>{
    if(typeof oldObject !== 'object') return oldObject;
    const object = {};
    for(let item in oldObject) 
        if(typeof oldObject[item] === 'object')
            object[item] = Array.isArray(oldObject[item])? 
                copyArray(oldObject[item]):
                copyObject(oldObject[item]);
        else object[item] = oldObject[item];
    return object;
}

/**
 * @param {number[]} protocols
 * @return {string}
 * */
const getVastVersionByProtocol = (protocols = []) => {
    const sorted = protocols.sort((a, b) => a - b);
    const lastEl = sorted[sorted.length - 1];
    return vastProtocols[lastEl] || '3.0';
}

/**
 * @param {number[]} protocols
 * @return {boolean}
 */
const validateProtocolsForWrapper = (protocols = []) => {
    let notSupp = true;
    for (let i = 0, l = suppWrapperProtocols.length; i < l; i++) {
        if (protocols.indexOf(suppWrapperProtocols[i]) !== -1) {
            notSupp = false;
            break;
        }
    }
    return notSupp;
}

/**
 * @param {string} xml
 * @return {?number}
 * */
const getVastProtocol = (xml) => {
    let matches = xml.match(versionRegex);
    if (matches) {
        const type = matches.groups.TYPE;
        let v = matches.groups.VERSION;
        let wrapper = '';
        if (v.length === 1) v = `${v}.0`;
        if (xml.indexOf('Wrapper') !== -1) wrapper = ' Wrapper';
        const vastStr = `${type} ${v}${wrapper}`;
        return vastDescToProtocol[vastStr];
    }
}

module.exports.copyObject = copyObject;
module.exports.copyArray = copyArray;
module.exports.getVastVersionByProtocol = getVastVersionByProtocol;
module.exports.validateProtocolsForWrapper = validateProtocolsForWrapper;
module.exports.getVastProtocol = getVastProtocol;