'use strict';

const Config        = require('./configs/config.json');
const ServerConfig  = require('./configs/serverconfig.json');
const Memcached     = require('memcached');
const fs            = require('fs');
const http          = require('http');
const os            = require('os');
const crypto        = require('crypto');
const Log           = require('./log.js').log;
const region        = require('./configs/serverconfig').region;

http.globalAgent.maxSockets = 850;

let aerospikeCounter = 0;
let redisCounter = 0;
let coreConnectedToKafkaCounter = 0;
let aerospikeCookieSyncCounter = 0;

let memcached = new Memcached(Config.memcachedLocal.host, Config.memcachedLocal.options);
let testFlag = true;

const ModelDSP = require('./models/ModelDSP');

function generateRID() {
    return crypto.randomBytes(16).toString('hex');
}

let readlineObj = {

    [Config.API.updateSspSeller]: (line) => {
        temporary_items[Config.API.updateSspSeller][line] = true;
    },

    [Config.API.updateSavedCreatives]:(line) => {
        temporary_items[Config.API.updateSavedCreatives][line] = true;
    },

    [Config.API.updateDSPAdapter]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.adapter][`${chunks[1]}|${chunks[0]}`] = +chunks[2];
    },

    [Config.API.updatePornList]:(line) => {
        temporary_items[Config.API.updatePornList][line] = true;
    },

    [Config.API.updateExcludeSSP]: (line) => {
        let chunks = line.split('@@@');
        if (temporary_items[Config.API.updateExcludeSSP][chunks[0]]) {
            temporary_items[Config.API.updateExcludeSSP][chunks[0]][chunks[1]] = true;
        } else {
            temporary_items[Config.API.updateExcludeSSP][chunks[0]] = {[chunks[1]]: true};
        }
    },

    [Config.API.updateBlockedPublishers]: (line) => {
        let chunks = line.split('@@@');
        if (temporary_items[Config.API.updateBlockedPublishers][chunks[0]]) {
            temporary_items[Config.API.updateBlockedPublishers][chunks[0]][chunks[1].toLowerCase()] = true;
        } else {
            temporary_items[Config.API.updateBlockedPublishers][chunks[0]] = {[chunks[1].toLowerCase()]: true};
        }
    },

    [Config.API.updateXandrPlacements]: (line) => {
        let chunks = line.split('@@@');
        if (temporary_items[Config.API.updateXandrPlacements][chunks[0]]) {
            temporary_items[Config.API.updateXandrPlacements][chunks[0]][chunks[1]] = +chunks[2];
        } else {
            temporary_items[Config.API.updateXandrPlacements][chunks[0]] = {[chunks[1]]: +chunks[2]};
        }
    },

    [Config.API.updateAdformPlacements]: (line) => {
        let chunks = line.split('@@@');
        if (!temporary_items[Config.API.updateAdformPlacements][chunks[0]]) temporary_items[Config.API.updateAdformPlacements][chunks[0]] = {};
        if (!temporary_items[Config.API.updateAdformPlacements][chunks[0]][chunks[1]]) {
            temporary_items[Config.API.updateAdformPlacements][chunks[0]][chunks[1]] = {};
        }
        temporary_items[Config.API.updateAdformPlacements][chunks[0]][chunks[1]][chunks[2]] = `${chunks[3]}`;


        // if (temporary_items[Config.API.updateAdformPlacements][chunks[0]]) {
        //     temporary_items[Config.API.updateAdformPlacements][chunks[0]][chunks[1]] = +chunks[2];
        // } else {
        //     temporary_items[Config.API.updateAdformPlacements][chunks[0]] = {[chunks[1]]: +chunks[2]};
        // }
    },

    [Config.API.updateSSPSettings]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updateSSPSettings][chunks[0]] = {
            'name': chunks[1],
            'tmax': +chunks[2],
            'minbfloor': +chunks[4],
            'isVast': +chunks[5],
            'nopriceadm': +chunks[6],
            'prepixel': +chunks[7],
            'secret_key': chunks[8],
            'seat': chunks[9],
            'blockbytmt': +chunks[10],
            'blockbygeoedge': +chunks[11],
            'ispop': +chunks[12],
            'id': +chunks[13],
            'company': chunks[14],
            'spendlimit': +chunks[15],
            'dailyspend': +chunks[16],
            'gzipRequests': +chunks[17],
            'gzipResponses': +chunks[18],
            'protobuf': +chunks[20],
            'nurlimpression': +chunks[21],
            'marga': +chunks[22],
            'popRespXml': +chunks[23],
            'active': +chunks[24],
            'sukaSSP': +chunks[25],
            'multiBanners': +chunks[26],
            'sspType': chunks[27],
            'blockDomains': chunks[28],
            'partnerid': chunks[29],
            'winrate': parseFloat(chunks[30]),
            'expiryTime': parseFloat(chunks[31]),
            'geo_edge_scanning': +chunks[32]
        };
        try {
            temporary_items[Config.API.updateSSPSettings][chunks[0]]['allowedDSP'] = JSON.parse(chunks[3]);
        } catch (e) {
            temporary_items[Config.API.updateSSPSettings][chunks[0]]['allowedDSP'] = {};
        }
        try {
            temporary_items[Config.API.updateSSPSettings][chunks[0]]['blockedCrids'] = JSON.parse(chunks[19]);
        } catch (e) {
            temporary_items[Config.API.updateSSPSettings][chunks[0]]['blockedCrids'] = {};
        }
    },

    [Config.API.updateDSPSettingsNew]:(line) => {
        try {
            let chunks = line.split('@@@');
            temporary_items[Config.API.updateDSPSettingsNew][chunks[0]] = new ModelDSP.Parser(chunks, ServerConfig.serverip);
        } catch (e) {
            console.log(`can't parse dsp settings`, e);
        }
    },

    [Config.API.updateDSPBlockedSites]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateDSPBlockedSites][chunks[0]]){
            temporary_items[Config.API.updateDSPBlockedSites][chunks[0]][chunks[1]] = true;
        } else {
            temporary_items[Config.API.updateDSPBlockedSites][chunks[0]] = {[chunks[1]]:true};
        }
    },

    [Config.API.updateBlockedCrids]:(line) => {
        let chunks = line.split('@@@');
        if (!temporary_items[Config.API.updateBlockedCrids][chunks[0]]) {
            temporary_items[Config.API.updateBlockedCrids][chunks[0]] = {};
        }
        temporary_items[Config.API.updateBlockedCrids][chunks[0]][chunks[1]] = true;
    },

    [Config.API.updateGlobalBlackListApps]:(line) => {
        temporary_items[Config.API.updateGlobalBlackListApps][line] = true;
    },

    [Config.API.updateGlobalBlackList]:(line) => {
        temporary_items[Config.API.updateGlobalBlackList][line] = true;
    },

    [Config.API.updateDSPBlockedBundles]:(line) => {
        let chunks = line.split('@@@');
        if(!temporary_items[Config.API.updateDSPBlockedBundles][chunks[0]]){
            temporary_items[Config.API.updateDSPBlockedBundles][chunks[0]] = {};
        }
        temporary_items[Config.API.updateDSPBlockedBundles][chunks[0]][chunks[1].toLowerCase()] = true;
    },

    [Config.API.updateDSPBlockedAppNames]:(line) => {
        let chunks = line.split('@@@');
        if(!temporary_items[Config.API.updateDSPBlockedAppNames][chunks[0]]){
            temporary_items[Config.API.updateDSPBlockedAppNames][chunks[0]] = {};
        }
        temporary_items[Config.API.updateDSPBlockedAppNames][chunks[0]][chunks[1]] = true;
    },

    [Config.API.updateDSPAllowedSites]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateDSPAllowedSites][chunks[0]]){
            temporary_items[Config.API.updateDSPAllowedSites][chunks[0]][chunks[1]] = true;
        } else {
            temporary_items[Config.API.updateDSPAllowedSites][chunks[0]] = {[chunks[1]]:true};
        }
    },

    [Config.API.updateDSPAllowedBundles]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateDSPAllowedBundles][chunks[0]]){
            temporary_items[Config.API.updateDSPAllowedBundles][chunks[0]][chunks[1]] = true;
        } else {
            temporary_items[Config.API.updateDSPAllowedBundles][chunks[0]] = {[chunks[1]]:true};
        }
    },

    [Config.API.updateDSPAllowedPublishers]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateDSPAllowedPublishers][chunks[0]]){
            temporary_items[Config.API.updateDSPAllowedPublishers][chunks[0]][chunks[1].toLowerCase()] = true;
        } else {
            temporary_items[Config.API.updateDSPAllowedPublishers][chunks[0]] = {[chunks[1].toLowerCase()]:true};
        }
    },

    [Config.API.updateDSPAllowedCarriers]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateDSPAllowedCarriers][chunks[0]]){
            temporary_items[Config.API.updateDSPAllowedCarriers][chunks[0]] += '|' + chunks[1];
        } else {
            temporary_items[Config.API.updateDSPAllowedCarriers][chunks[0]] = chunks[1];
        }
    },

    [Config.API.updateWinrates]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updateWinrates][`${chunks[0]}|${chunks[1]}`] = +chunks[2];
    },

    [Config.API.updateBlockedCreativesTMT]:(line) => {
        temporary_items[Config.API.updateBlockedCreativesTMT][line] = true;
    },

    [Config.API.updateBlockedDomainsTMT]:(line) => {
        temporary_items[Config.API.updateBlockedDomainsTMT][line] = true;
    },

    [Config.API.updateCachedCreativesTMT]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updateCachedCreativesTMT][chunks[0]] = +chunks[1];
    },

    [Config.API.updateDSPAllowedSizes]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateDSPAllowedSizes][chunks[0]]) {
            temporary_items[Config.API.updateDSPAllowedSizes][chunks[0]][chunks[1]] = true;
        } else {
            temporary_items[Config.API.updateDSPAllowedSizes][chunks[0]] = {[chunks[1]]:true};
        }
    },

    [Config.API.updateSSPBlockedPubs]:(line) => {
        let chunks = line.split('@@@');
        if(temporary_items[Config.API.updateSSPBlockedPubs][+chunks[0]]) {
            temporary_items[Config.API.updateSSPBlockedPubs][+chunks[0]][chunks[1]] = true;
        } else {
            temporary_items[Config.API.updateSSPBlockedPubs][+chunks[0]] = {[chunks[1]]:true};
        }
    },

    [Config.API.updateConfirmedBundles]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updateConfirmedBundles][chunks[0].toLowerCase()] = {'name':chunks[1], 'cats':chunks[2].replace(/\[|'| |"|\]/g, '').split(','), 'pubName': chunks[3]};
    },

    [Config.API.updatePixalateFraudCH]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updatePixalateFraudCH][chunks[0]] = {'scans':+chunks[1], 'fraud':+chunks[2]};
    },

    [Config.API.updateCustomSSP]:(line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updateCustomSSP][chunks[0]] = {'id': +chunks[1], 'domain':chunks[3]};
    },
    [Config.API.updateDirectSchain]: (line) => {
        let chunks = line.split('@@@');
        temporary_items[Config.API.updateDirectSchain][chunks[0]] = chunks[1];
    },
    [Config.API.updateInDirectSchain]: (line) => {
        let chunks = line.split('@@@');
        let bundleName = chunks[0];
        let asi0 = chunks[1].toLowerCase();
        let sid0 = chunks[2];
        let name0 = chunks[3];
        let domain0 = chunks[4];
        let asi1 = chunks[5];
        let sid1 = chunks[6];
        let name1 = chunks[7];
        let domain1 = chunks[8];
        let rid = generateRID();

        if (!temporary_items[Config.API.updateInDirectSchain][bundleName]) {
            temporary_items[Config.API.updateInDirectSchain][bundleName] = {
                nodes: []
            };
        }
        temporary_items[Config.API.updateInDirectSchain][bundleName].nodes.push({
            asi: asi1,
            sid: sid1,
            name: name1,
            domain: domain1,
            rid: rid
        });

        temporary_items[Config.API.updateInDirectSchain][bundleName].nodes.push({
            asi: asi0,
            sid: sid0,
            name: name0,
            domain: domain0
        });
    }
}
let temporary_items = {
    [Config.API.updateSavedCreatives] : {},
    [Config.API.updateDSPAdapter] : {},
    [Config.API.updateBlockedPublishers] : {},
    [Config.API.updateXandrPlacements] : {},
    [Config.API.updateAdformPlacements] : {},
    [Config.API.updateSSPSettings] : {},
    [Config.API.updateSSPBlockedPubs] : {},
    [Config.API.updateDSPSettingsNew] : {},
    [Config.API.updateDSPBlockedSites] : {},
    [Config.API.updateBlockedCrids] : {},
    [Config.API.updateDSPBlockedBundles] : {},
    [Config.API.updateGlobalBlackListApps] : {},
    [Config.API.updateGlobalBlackList] : {},
    [Config.API.updateDSPBlockedAppNames] : {},
    [Config.API.updatePornList] : {},
    [Config.API.updateDSPAllowedSites] : {},
    [Config.API.updateExcludeSSP] : {},
    [Config.API.updateDSPAllowedBundles] : {},
    [Config.API.updateDSPAllowedPublishers] : {},
    [Config.API.updateDSPAllowedCarriers] : {},
    [Config.API.updateWinrates] : {},
    [Config.API.updateBlockedCreativesTMT] : {},
    [Config.API.updateBlockedDomainsTMT] : {},
    [Config.API.updateCachedCreativesTMT] : {},
    [Config.API.updateDSPAllowedSizes] : {},
    [Config.API.updateConfirmedBundles] : {},
    [Config.API.updatePixalateFraudCH] : {},
    [Config.API.updateCustomSSP] : {},
    [Config.API.updateSspSeller]: {},
    [Config.API.updateDirectSchain]: {},
    [Config.API.updateInDirectSchain]: {},
};

let cached_temporary_items = {
    [Config.API.updateSavedCreatives] : '',
    [Config.API.adapter] : '',
    [Config.API.updateBlockedPublishers] : '',
    [Config.API.updateXandrPlacements] : '',
    [Config.API.updateAdformPlacements] : '',
    [Config.API.updateSSPSettings] : '',
    [Config.API.updateSSPBlockedPubs] : '',
    [Config.API.updatePornList] : {},
    [Config.API.updateDSPSettingsNew] : '',
    [Config.API.updateDSPBlockedSites] : '',
    [Config.API.updateBlockedCrids] : '',
    [Config.API.updateGlobalBlackListApps] : '',
    [Config.API.updateGlobalBlackList] : '',
    [Config.API.updateDSPBlockedBundles] : '',
    [Config.API.updateDSPBlockedAppNames] : '',
    [Config.API.updateDSPAllowedSites] : '',
    [Config.API.updateDSPAllowedBundles] : '',
    [Config.API.updateDSPAllowedPublishers] : '',
    [Config.API.updateExcludeSSP] : {},
    [Config.API.updateDSPAllowedCarriers] : '',
    [Config.API.updateWinrates] : '',
    [Config.API.updateBlockedCreativesTMT] : '',
    [Config.API.updateBlockedDomainsTMT] : '',
    [Config.API.updateCachedCreativesTMT] : '',
    [Config.API.updateDSPAllowedSizes] : '',
    [Config.API.updateConfirmedBundles] : '',
    [Config.API.updatePixalateFraudCH] : '',
    [Config.API.updateCustomSSP] : '',
    [Config.API.updateSspSeller] : '',
    [Config.API.updateDirectSchain]: '',
    [Config.API.updateInDirectSchain]: ''
};

function write(type, needCache) {
console.log(`${Config.baseObjectsPath}${type}.conf`)
    if (!type) {
        console.error('Error writing settings to file: object is not specified', type);
        return false;
    }

    let filename = `${Config.baseObjectsPath}${type}.conf`;

    http.get({
        host: Config.settingsApi[region].host,
        port: Config.settingsApi[region].port,
        path: `/${type}?pwd=${Config.settingsApiPassword}&platform=${ServerConfig.platform}&region=${region}`,
        headers: {'Connection': 'close'}
    }, (res) => {
        let data = '';

        res.on('error', (err) => {
            console.log(`Writing unsuccessful ${type}`);
            console.log(`Error http: ${err}`);
        });

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', (err) => {

            if (err) {
                console.log(`Writing unsuccessful ${type}`);
                console.log(`Error http: ${err}`);
            }

            let md5ver = crypto.createHash('md5').update(data).digest('hex');

            if (type === Config.API.updateConfirmedBundles) {

                fs.writeFile(filename, data, (err) => {
                    if (err) {
                        console.log(`Writing unsuccessful ${type}`);
                        console.log(`Error writing to file: ${err}`);
                    } else {
                        if (testFlag === true) {
                            process.send({'name': type, 'val': 'file'}, (err) => {});
                            testFlag = false;
                        }
                    }
                });
                return true;
            }

            if (type === Config.API.updateConfirmedBundlesUpd) {
                fs.writeFile(filename, data, (err) => {
                    if (err) {
                        console.log(`Writing unsuccessful ${type}`);
                        console.log(`Error writing to file: ${err}`);
                    } else {
                        process.send({'name': type, 'val': 'file'}, (err) => {});
                    }
                });
                return true;
            }

            if (cached_temporary_items[type] !== '' && cached_temporary_items[type] === md5ver) {
                // console.log("CACHED ! - " + type);
                return true;
            } else {
                if (needCache === true) cached_temporary_items[type] = md5ver;

                if (type === Config.API.updateSitePricesNew) {
                    fs.writeFile(filename, data, (err) => {
                        if (err) {
                            console.log(`Writing unsuccessful ${type}`);
                            console.log(`Error writing to file: ${err}`);
                        } else {
                            process.send({'name': type, 'val': 'file'}, (err) => {});
                        }
                    });
                } else {
                    if (data !== '') {
                        let tmp = data.split('\n');
                        let l = tmp.length;
                        for (let i = 0; i < l; i++) {
                            if (tmp[i])
                                readlineObj[type](tmp[i]);
                        }
                    }

                    fs.writeFile(filename, JSON.stringify(temporary_items[type]), (err) => {
                        if (err) {
                            console.log(`Writing unsuccessful ${type}`);
                            console.log(`Error writing to file: ${err}`);
                        } else {
                            process.send({'name': type, 'val': 'file'});
                            temporary_items[type] = {};
                        }
                    });
                }
            }
        });
    }).on('error', (err) => {
        console.error('Write http error:', err);
        return false;
    });
}

write(Config.API.updateSSPSettings, true);
setTimeout(() => {write(Config.API.updateDSPSettingsNew, true)}, 2000);
setTimeout(() => {write(Config.API.updateDSPBlockedSites, true)}, 4000);
setTimeout(() => {write(Config.API.updateDSPBlockedAppNames, true)}, 6000);
setTimeout(() => {write(Config.API.updateDSPBlockedBundles, true)}, 8000);
setTimeout(() => {write(Config.API.updateDSPAllowedSites, true)}, 10000);
setTimeout(() => {write(Config.API.updateDSPAllowedBundles, true)}, 12000);
setTimeout(() => {write(Config.API.updateDSPAllowedPublishers, true)}, 14000);
setTimeout(() => {write(Config.API.updateDSPAllowedCarriers, true)}, 16000);
setTimeout(() => {write(Config.API.updateDSPAllowedSizes, true)}, 18000);
setTimeout(() => {write(Config.API.updateConfirmedBundles, true)}, 20000);
setTimeout(() => {write(Config.API.updateBlockedCreativesTMT, true)}, 22000);
setTimeout(() => {write(Config.API.updateBlockedDomainsTMT, true)}, 24000);
setTimeout(() => {write(Config.API.updateCachedCreativesTMT, true)}, 26000);
setTimeout(() => {write(Config.API.updateWinrates, true)}, 28000);
setTimeout(() => {write(Config.API.updateSitePricesNew, true)}, 30000);
setTimeout(() => {write(Config.API.updatePornList, true)}, 32000);
setTimeout(() => {write(Config.API.updateBlockedCrids, true)}, 34000);
setTimeout(() => {write(Config.API.updateBlockedPublishers, true)}, 36000);
setTimeout(() => {write(Config.API.updateGlobalBlackListApps, true)}, 38000);
setTimeout(() => {write(Config.API.updateGlobalBlackList, true)}, 40000);
setTimeout(() => {write(Config.API.updatePixalateFraudCH, true)}, 42000);
setTimeout(() => {write(Config.API.updateXandrPlacements, true)}, 44000);
setTimeout(() => {write(Config.API.updateSSPBlockedPubs, true)}, 46000);
setTimeout(() => {write(Config.API.updateExcludeSSP, true)}, 48000);
setTimeout(() => {write(Config.API.updateSavedCreatives, true)}, 50000);
setTimeout(() => {write(Config.API.updateSspSeller, true)}, 52000);
setTimeout(() => {write(Config.API.updateAdformPlacements, true)}, 54000);
setTimeout(() => {write(Config.API.updateDirectSchain, true)}, 56000);
setTimeout(() => {write(Config.API.updateInDirectSchain, true)}, 56000)

if (!Config.aerospikeAdapter) {
    write(Config.API.updateDSPAdapter, true);
}

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateDSPSettingsNew, true);
    }, 5 * 60 * 1000);
}, 3000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateSSPSettings, true);
        setTimeout(() => {write(Config.API.updateDSPBlockedSites, true)}, 6000);
        setTimeout(() => {write(Config.API.updateDSPBlockedAppNames, true)}, 9000);
        setTimeout(() => {write(Config.API.updateDSPBlockedBundles, true)}, 12000);
        setTimeout(() => {write(Config.API.updateDSPAllowedSites, true)}, 15000);
        setTimeout(() => {write(Config.API.updateDSPAllowedBundles, true)}, 18000);
        setTimeout(() => {write(Config.API.updateDSPAllowedPublishers, true)}, 19000);
        setTimeout(() => {write(Config.API.updateDSPAllowedCarriers, true)}, 21000);
        setTimeout(() => {write(Config.API.updateDSPAllowedSizes, true)}, 24000);
        setTimeout(() => {write(Config.API.updateBlockedPublishers, true)}, 27000);
        setTimeout(() => {write(Config.API.updateBlockedCrids, true)}, 30000);
        setTimeout(() => {write(Config.API.updatePornList, true)}, 33000);
        setTimeout(() => {write(Config.API.updateGlobalBlackListApps, true)}, 36000);
        setTimeout(() => {write(Config.API.updateGlobalBlackList, true)}, 39000);
        setTimeout(() => {write(Config.API.updateXandrPlacements, true)}, 42000);
        setTimeout(() => {write(Config.API.updateAdformPlacements, true)}, 45000);
        setTimeout(() => {write(Config.API.updateDirectSchain, true)}, 48000);
        setTimeout(() => {write(Config.API.updateInDirectSchain, true)}, 48000);
    }, 5 * 60 * 1000);
}, 3000);

setTimeout( () => {
    setInterval(() => {
        write(Config.API.updateBlockedCreativesTMT, true);
    }, 3*60*1000);
}, 1000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateBlockedDomainsTMT, true);
    }, 3 * 60 * 1000);
}, 4000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateCachedCreativesTMT, true);
    }, 6 * 60 * 1000);
}, 3 * 1000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateExcludeSSP, true);
    }, 12 * 60 * 1000);
}, 10000);

if (!Config.aerospikeAdapter){
    setTimeout(() => {
        setInterval(() => {
            write(Config.API.adapter, true);
        }, 3 * 60 * 1000);
    }, 1500);
}

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateWinrates, true);
    }, 10 * 60 * 1000);
}, 8000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateConfirmedBundlesUpd, true);
    }, 11 * 60 * 1000);
}, 3000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateSavedCreatives, true);
    }, 7 * 60 * 1000);
}, 10000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateConfirmedBundles, true);
    }, 45 * 60 * 1000);
}, 22000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateSitePricesNew, true);
    }, 30 * 60 * 1000); // 30min
}, 14000);

setTimeout(() => {
    write(Config.API.updateCustomSSP, true);
    setInterval(() => {
        write(Config.API.updateCustomSSP, true);
    }, 19 * 60 * 1000);
}, 16000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateSspSeller, true);
    }, 60 * 60 * 1000);
}, 30000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updatePixalateFraudCH, true);
    }, 30 * 60 * 1000);
}, 17000);

setTimeout(() => {
    setInterval(() => {
        write(Config.API.updateSSPBlockedPubs, true);
    }, 30 * 60 * 1000);
}, 19000);

fs.stat(Config.listNURL, (err, stats) => {
    if (err) {
        if (err.code == 'ENOENT') {
            fs.writeFile(Config.listNURL, '{}', (err_write) => {
                if (err_write) console.error(err_write);
            });
        }
    } else {
        if (!stats.isFile()) {
            fs.writeFile(Config.listNURL, '{}', (err_write) => {
                if (err_write) console.error(err_write);
            });
        }
    }
});

fs.stat(Config.listBURL, (err, stats) => {
    if (err) {
        if (err.code == 'ENOENT') {
            fs.writeFile(Config.listBURL, '{}', (err_write) => {
                if (err_write) console.error(err_write);
            });
        }
    } else {
        if (!stats.isFile()) {
            fs.writeFile(Config.listBURL, '{}', (err_write) => {
                if (err_write) console.error(err_write);
            });
        }
    }
});


process.on('message', (message) => {
    if (message['name'] === 'coreConnectedToAerospike') {
        aerospikeCounter++;
        if (aerospikeCounter == os.cpus().length) {
            Log('info', 'All cores successfully connected to aerospike server');
        }
    } else if (message['name'] === 'coreConnectedToRedis') {
        redisCounter++;
        if (redisCounter == os.cpus().length) {
            Log('info', 'All cores successfully connected to redis');
        }
    }else if (message['name'] === 'coreConnectedToAerospikeCookieSync') {
        aerospikeCookieSyncCounter++;
        if (aerospikeCookieSyncCounter == os.cpus().length) {
            Log('info', 'All cores successfully connected to cookie sync aerospike server');
        }
    } else if (message['name'] === 'coreConnectedToKafka'){
        coreConnectedToKafkaCounter++;
        if (coreConnectedToKafkaCounter === os.cpus().length) { //os.cpus().length) {
            Log('info', 'All cores successfully connected to kafka');
        }
    }
});
