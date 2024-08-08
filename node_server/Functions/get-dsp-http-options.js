module.exports = (key, openRTBVersion, dataLength, defaultPath = null)=>{
    return {
        agent: globalServices.keepaliveAgent,
        host: (globalStorage.dsplookupip[key] ? globalStorage.dsplookupip[key] : globalStorage.dsp_partners[key]['host']),
        port: globalStorage.dsp_partners[key]['port'],
        path: defaultPath || globalStorage.dsp_partners[key]['path'],
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-openrtb-version': openRTBVersion,
            'host':`${(globalStorage.dsp_partners[key]['badhost'] ? globalStorage.dsp_partners[key]['badhost'] : globalStorage.dsp_partners[key]['host'])}`,
            'Content-Length': dataLength
    
        }
    };
};