'use strict';
/************ requires ************/
const Config        = require('./configs/config.json');
const ServerConfig  = require('./configs/serverconfig.json');
const Library       = require('./Library.json');
const Functions     = require('./Functions');
const Prepare       = require('./prepare.js');
const SSPConnectors = require('./connectors/SSPConnectors.js');
const DSPConnectors = require('./connectors/DSPConnectors.js');
const userSync      = require('./libs/cookie_sync/cookieSync');
const nativeModule  = require('./modules/native');
const Log           = require('./log.js').log;
const http          = require('http');
const https         = require('https');
const urlp          = require('url');
const clone         = require('clone');
const fs            = require('fs');
const dns           = require('dns');
const crypto        = require('crypto');
const zlib          = require('zlib');
const Aerospike     = require('aerospike');
const Memcached     = require('memcached');
const MongoClient   = require('mongodb').MongoClient;
const async         = require('async');
const Agent         = require('agentkeepalive');
const HttpsAgent    = require('agentkeepalive').HttpsAgent;
const region        = require('./configs/serverconfig').region;
const vast          = require('./modules/vast');
const utils         = require('./utils');
const tcf2Module    = require('./modules/tcf');
const ModelDSP      = require('./models/ModelDSP');
const XLSX          = require('xlsx');


let limitTraffic = 0
setInterval(()=> {
    limitTraffic = 0
}, 1000)


const {
    echoBadEnd,
    echoGoodEnd,
    echoLog,
    echoGzipResponse,
    echoEcho,
    echoGoodEndXml,
    echoNoBidEnd,
    echoRedirect,
    addCountCoreQpsSSP,
    addCountCoreBidQpsDSP,
    addCountCoreMaxQpsDSP,
    addCountCoreRealQpsDSP,
    makeResponseGzipEncoding,
    parseResponse,
    storeBidEvents,
    createRequestObject,
    addPixalateMacros,
    streamToString
} = require('./Functions');
const updateSourceObject = require('./Functions/make-post-object/update-source-object.js')
const addGetEdgeCreativeWrapper = require('./Functions/add-geoEdge-creative-wrapper.js');

const ReqResStorage = require('./services/statistics/req-res-storage');
// const sspRequestStatsService = require('./services/statistics/ssp-request-stats-service');
const SSPStatsUnitModel = require('./models/ModelSSPStatsUnit');
const {
    SspMinRequirementsStatsService,
    DspHourlyStatsService,
    DspInfoService,
} = require('./services/statistics');

const dspInfoService = new DspInfoService(ServerConfig.writeDspHourlyStatsExamples)


global.globalServices = {
    sspMinRequirementsStatsService: new SspMinRequirementsStatsService(),
    dspHourlyStatsService: new DspHourlyStatsService(ServerConfig.writeDspHourlyStatsExamples),
    userSync: userSync,
    cached: {},
    memcached: new Memcached(Config.memcachedLocal.host, Config.memcachedLocal.options),
    AerospikeClient: Aerospike.client(Config['aerospike']['storageConn'][ServerConfig['region']]),
    keepaliveAgent: new Agent({
        keepAlive: true,
        freeSocketTimeout: 16000,
        keepAliveMsecs: 9000
    }),
    keepaliveHttpsAgent: new HttpsAgent({
        keepAlive: true,
        freeSocketTimeout: 16000,
        keepAliveMsecs: 9000
    })
};

if (Config.enableSSPInfo) {
    // setInterval(() => sspRequestStatsService.storeResults(global.globalServices.kafkaProducer), 10 * 1000)
}
global.globalStorage = {
    cluster_config: JSON.parse(process.env.WORKER_CONFIG || '{}'),
    adapterPoints: {},
    dspPartners: {},
    sspDspRate: {},
    checkedBundles: {},
    CoreDSPqps: {}, //Bid qps for DSP
    CoreMaxQpsDsp: {}, //Bid max qps for DSP
    CoreRealQpsDsp: {}, //Real qps for DSP
    CoreQpsSsp: {}, //qps SSP
    bundlesForCheck: {}, //new obj for bundles
    confirmedBundles: {}, //new obj for checked bundles
    customSSP: {},
    sspSeller: {},
    xandrPlacements: {},
    adformPlacements: {},
    dspPreSetSettings: {},
    adapterIncreaseRate: {},
    schainDataMagnite: {},
    directSchain: {},
    inDirectSchain: {}
}

const reqResStorage = new ReqResStorage(globalStorage.cluster_config.pid === 6 && ServerConfig.writebidRequestExamples);
//TODO: remove me
const stiristaDsp = [
    "stirista_luna-stirista-display_low_US_EAST",
    "stirista_luna-stirista-display_top_US_EAST",
    "stirista_luna-stirista-display-political_low_US_EA",
    "stirista_luna-stirista-display-political_top_US_EA",
    "stirista_luna-stirista-political-general_low_US_EA",
    "stirista_luna-stirista-political-general_top_US_EA"
];

/*********** redis test */
const createRedisClient = require('redis').createClient;

const redisClient = createRedisClient({
    url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', err => console.log('Redis Client Error', err));


setTimeout(async ()=> {
    await redisClient.connect();
}, 1000)

/************  end requires ************/

/************ dns ***************/
async function lookupPromise(host) {
        return new Promise((resolve, reject) => {
                dns.lookup(host, (err, address, family) => {
                        if(err) reject(err);
                        resolve(address);
                    });
            });
    };
+/************ end dns ***********/


/************ read schain data */
function mapObject(excelData) {
    const mappedObject = {};
    excelData.forEach(row => {
        const appBundle = row['app_bundle']; // Convert to string in case 'App bundle' is numeric
        const sid = row['ssid'];
        mappedObject[appBundle] = sid;
    });
    return mappedObject;
}

function mapObjectMagnite(excelData) {
    const mappedObject = {};
    excelData.forEach(row => {
        const appBundle = row['app_bundle']; // Convert to string in case 'App bundle' is numeric
        const zoneId = row['zone_id'];
        const accountId = row['account_id'];
        const siteId = row['site_id']
        mappedObject[appBundle] = {
            appBundle,
            zoneId,
            accountId,
            siteId
        };
    });
    
    return mappedObject;
}

// try{
//     const workbook = XLSX.readFile('./libs/schain_direct.xlsx');
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     global.globalStorage.schainData = mapObject(XLSX.utils.sheet_to_json(sheet));
//     console.log("Schain data is read.")
// }
// catch(ex){
//     console.error(`Error in reading schain_direct.xlsx: ${ex.message}`);
// }

try{
    const workbook = XLSX.readFile('./libs/magnite.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    global.globalStorage.magniteIntegration = mapObjectMagnite(XLSX.utils.sheet_to_json(sheet));
    console.log("Schain Magnite data is read.")
}
catch(ex){
    console.error(`Error in reading magnite.xlsx: ${ex.message}`);
}

// try {
//     // Attempt to load the 'indirect_schain.json' file from the './libs' directory
//     global.globalStorage.indirectSchainData = require("./libs/indirect_schain.json");
//
//     // Check if the loaded data is not null or undefined
//     if (!global.globalStorage.indirectSchainData) {
//         throw new Error("Loaded indirect_schain.json is empty or invalid.");
//     }
//
//     const indirectSchainLowerCase = {};
//     Object.keys(global.globalStorage.indirectSchainData).forEach(key => {
//         const lowerCaseKey = key.toLowerCase();
//         indirectSchainLowerCase[lowerCaseKey] = global.globalStorage.indirectSchainData[key];
//     });
//     global.globalStorage.indirectSchainData = indirectSchainLowerCase;
// } catch (ex) {
//     // Log the error with a corrected reference to the actual file in question
//     console.error(`Error in reading indirect_schain.json: ${ex.message}`);
// }

/************ read schain data */

//Connect to Aerospike
globalServices.AerospikeClient.connect((err) => {
    if (err) {
        console.error('Error connecting to aerospike.', err);
    } else {
        process.send({'name': 'coreConnectedToAerospike'}, (err) => {});
    }
});

if (globalStorage.cluster_config.pid == globalStorage.cluster_config.maxpid - 1) {
    const Database = require('./Database.js');
}

/************ end global configuration ************/

/************ global objects ************/
let blockedCreativesTMT = {"empty": "1"};
let checkedCreativesTMT = {};
let allowedCreativesTMT = {}; //crid for premium SSP
let blockedDomainsTMT = {};
let blockedCrids = {};
let cacheTMTDomains = {};
let supplyPartners = {};
let allowedSizes = {};
let pornList = {};
let allowedBundles = {};
let allowedSites = {};
let blockedSites = {};
let allowedPublishers = {};
let blockedAppNames = {};
let blockedBundles = {};
let blockedPublishers = {};
let blockedSitesGlobal = {};
let blockedAppsGlobal = {};
let allowedCarriers = {};
//let iurltags = {};
//let iurltagslearn = {};
let pixalateKeys = {};
let excludeSSP = {};
let typeTraf = {native: {}, video: {}, banner: {}, audio: {}};
let savedTags = {};
let updateCridData = {};
let adapterPerformer = {};
let prevBid = {};
let siteAVGPrice = {};
let blockedSSPPubs = {};
let adapterdsp = {};

/********** automatic log settings *********/

let logWrite = false;
let logParameters = {};
let logObject = {};

/************ end global objects ************/

/********** checkTypeTraf *********/
let checkTypeTraf = false;

/************ update settings ************/
let jobtimer = null;

process.env.NODE_ENV = 'production';

const { Registry, collectDefaultMetrics, Counter } = require('prom-client');
const {PrometheusService, Prometheus_register} = require("./services/prometheus/prometheus.service");
const {addBidReqMongo, insertBidRequestIntoMongo, addBidResMongo, insertBidResponseIntoMongo, addNurlMongo, insertNurlIntoMongo, addImprMongo, insertImprIntoMongo, addOurBidReqMongo, insertOurBidRequestIntoMongo, insertBurlIntoMongo, addBurlMongo} = require("./Functions/analytics");

process.on('message', async (message) => {

    if (!message['name']) console.log(`BAD MESSAGE - ${message}`);

    switch (message['name']) {
        case 'getMetrics':
            const metrics = await Prometheus_register.getMetricsAsJSON();
            process.send({ 'type': 'metrics', metrics });
            return
            break;
        case 'coreConnectedToAerospike':
            break;
        case 'coreConnectedToAerospikeCookieSync':
            break;
        case 'startLog':
            try {
                logParameters = JSON.parse(message['val']);
            } catch (e) {
                return false;
            }
            logWrite = true;
            break;
        case 'logEnd':
            logWrite = false;
            fs.appendFileSync('/nodejs/node_logs/logobject.txt', JSON.stringify(logObject) + '\n');
            logObject = {};
            break;
        default:
            if (Config.API.hasOwnProperty(message['name'])) {
                if (message['val'] == 'file') {
                    if (readyToJob || jobtimer) {
                        readyToJob = false;
                        if (jobtimer) clearTimeout(jobtimer);
                        jobtimer = setTimeout(() => {
                            readyToJob = true;
                            jobtimer = null;
                        }, 60);
                    }

                    switch (message['name']) {
                        case 'updateConfirmedBundles':
                        case 'updateConfirmedBundlesUpd':
                            fs.readFile(`${Config.baseObjectsPath}${message['name']}.conf`, 'utf8', (err, data) => {
                                if (!data) {
                                    console.log(`${message['name']} - EMPTY`);
                                    return;
                                }
                                let lines = data.split('\n');
                                for (let i = 0, len = lines.length - 1; i < len; i++) {
                                    let chunks = lines[i].split('@@@');
                                    globalStorage.confirmedBundles[chunks[0].toLowerCase()] = {
                                        'name': chunks[1],
                                        'cats': chunks[2].split(','),
                                        'pubName': chunks[3]
                                    }
                                }
                            });
                            return;
                    }

                    fs.readFile(`${Config.baseObjectsPath}${message['name']}.conf`, 'utf8', (err, data) => {
                        if (!data) {
                            console.log(`${message['name']} - EMPTY`);
                            return;
                        }

                        try {
                            readcloseObj[message['name']](JSON.parse(data));
                        } catch (error) {
                            console.error(message['name'], ' error while reading from file', error);
                        }

                    });
                } else if (message['val'] == 'memcached') {
                    //vova
                    console.log(`message is ${message['val']}`)
                    // globalServices.memcached.get(`updatedata_${message['name']}`, (err, data) => {
                    //     if (!data || data == false) return;
                    //     readcloseObj[message['name']](data);
                    // });
                } else {
                    console.log(`READ - ${message['name']}`);
                    readcloseObj[message['name']](JSON.parse(message['val']));
                }
            } else {
                console.error('Error process.on(message)', message['name']);
            }
            break;
    }
});

/************ end update settings ************/

/************ forced settings load ************/
if (process.env.FORCED === 'true') {
    console.log('force restart, start to load settings');
    let configs = Object.keys(Config.API);
    configs.push(configs.splice(configs.indexOf(Config.API.updateDSPSettingsNew), 1)[0]);
    configs.forEach(name => {
        fs.readFile(`${Config.baseObjectsPath}${name}.conf`, 'utf8', (err, data) => {
            if (!data) {
                console.log(`${name} - EMPTY`);
                return;
            }
            try {
                readcloseObj[name](JSON.parse(data));
            } catch (error) {
                console.error('error while reading', name, err);
            }
            console.log('force loaded', name);
        });
    })
}
/************ end forced settings load ************/


/************ mongo configuration ************/
MongoClient.connect(Config.mongo.host, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    if (err) {
        console.error('Mongo client error', err);
        process.kill(process.pid, 'SIGTERM');
    } else {
        const db = client.db('exchange');

        db.collection('checkwins', (err, coll) => {
            globalServices.cached.checkwins = coll;
        });

        db.collection('winimpressions', (err, coll) => {
            if (err) console.error('Error get collection mongodb (impressions)', err);
            globalServices.cached.impressions = coll;
        });

        db.collection('imprssp', (err, coll) => {
            if (err) console.error('Error get collection mongodb (detailedStatistic)', err);
            globalServices.cached.detailedStatistic = coll;
        });

        db.collection('winimpressionsnurl', (err, coll) => {
            if (err) console.error('Error get collection mongodb (winimpressionsnurl)', err);
            globalServices.cached.impressionsNurl = coll;
        });

        db.collection('imprsspnurl', (err, coll) => {
            if (err) console.error('Error get collection mongodb (imprsspnurl)', err);
            globalServices.cached.detailedStatisticNurl = coll;
        });

        db.collection('responseimpressions', (err, coll) => {
            globalServices.cached.responseimpressions = coll;
        });

        /*db.collection('iurltags', (err, coll) => {
            globalServices.cached.iurltags = coll;

            globalServices.cached.iurltags.find().toArray((err, data) => {
                if (err) {
                    console.log('iurltags error: ', err);
                } else {
                    iurltags = {};
                    for (var i = 0; i < data.length; i++) {
                        iurltags[data[i]['_id']] = true;
                    }
                }
            });
        });*/

        db.collection('updateCridData', (err, coll) => {
            globalServices.cached.updateCridData = coll;
        });

        db.collection('bundlesForCheck', (err, coll) => {
            globalServices.cached.bundlesForCheck = coll;
        });

        db.collection('nurlimpressions', (err, coll) => {
            if (err) console.error('Error get collection mongodb (impressionsbynurl)', err);
            globalServices.cached.impressionsbynurl = coll;
        });

        db.collection('typeTraf', (err, coll) => {
            globalServices.cached.typeTraf = coll;
        });

        globalServices.sspMinRequirementsStatsService.init(db);
        globalServices.dspHourlyStatsService.init(db);
        dspInfoService.init(db);
        reqResStorage.init(client, db);
    }
});

MongoClient.connect(ServerConfig.mongoAnalytics.host, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    if (err) {
        console.error('Mongo client error', err);
        process.kill(process.pid, 'SIGTERM');
    } else {
        const db = client.db('exchange');

        db.collection(`bidRequests_${globalStorage.cluster_config.pid}`, (err, coll) => {
            globalServices.cached.bidRequests = coll;
        });

        db.collection(`bidResponses_${globalStorage.cluster_config.pid}`, (err, coll) => {
            globalServices.cached.bidResponses = coll;
        });

        db.collection(`nurls_${globalStorage.cluster_config.pid}`, (err, coll) => {
            globalServices.cached.nurls = coll;
        });

        db.collection(`impressions1_${globalStorage.cluster_config.pid}`, (err, coll) => {
            globalServices.cached.impressions1 = coll;
        });

        db.collection(`ourBidRequests_${globalStorage.cluster_config.pid}`, (err, coll) => {
            globalServices.cached.ourBidRequests = coll;
        });

        db.collection(`burls_${globalStorage.cluster_config.pid}`, (err, coll) => {
            globalServices.cached.burls = coll;
        });

        //dspInfoService.init(db);
        //reqResStorage.init(client, db);
    }
});


/************ end mongo configuration ************/

/************ mongo functions ************/

function startCheckTypeTraf() {
    checkTypeTraf = true;
    setTimeout(() => {
        checkTypeTraf = false;
    }, 30 * 60 * 1000);
    setTimeout(saveTypeTraf, 35 * 60 * 1000);
}

if (new Date().getHours() === 14) {
    startCheckTypeTraf()
}
setInterval(() => {
    if (new Date().getHours() === 14) {
        startCheckTypeTraf()
    }
}, 60 * 60 * 1000)

function saveTypeTraf() {
    if (globalServices.cached.typeTraf) {
        globalServices.cached.typeTraf.insertOne(typeTraf, (err, res) => {
            if (err) console.error('Error insert to mongodb (saveTypeTraf):', err);
            typeTraf = {native: {}, video: {}, banner: {}, audio: {}};
        });
    }
}

//bundles module
function saveBundlesForCheck() {
    globalServices.cached.bundlesForCheck.insertOne(globalStorage.bundlesForCheck, empf);
    globalStorage.bundlesForCheck = {};
}

setInterval(saveBundlesForCheck, 9 * 60 * 1000);

/************ end mongo functions ************/

let erroredNurls = {};
function callErroredNurls() {//TEST!
    try {
        let keys = Object.keys(erroredNurls);
        let l = keys.length;
        for (let i = 0; i < l; i++) {
            const protocol = (erroredNurls[keys[i]][0].indexOf('https') === 0 ? 'https' : 'http');
            const tmp = erroredNurls[keys[i]][0].replace(/https:\/\/|http:\/\//, '');
            if (tmp.indexOf('undefined') === 0) {
                delete erroredNurls[keys[i]];
                continue;
            }
            const host = tmp.split('/');
            const port = host[0].split(':');
            const nurl_ = keys[i];

            if (port[1]) host[0] = port[0];
            if (!nurls[host[0]]) {
                dns.lookup(host[0], function onLookup(err, addresses, family) {
                    nurls[host[0]] = addresses;
                });
            }

            const requestModule = (protocol === 'https') ? https : http;
            const agent = (protocol === 'https') ? globalServices.keepaliveHttpsAgent : globalServices.keepaliveAgent;
            const defaultPort = (protocol === 'https') ? '443' : '80';
            try {
                requestModule.request({
                    agent: agent,
                    host: (nurls[host[0]] ? nurls[host[0]] : host[0]),
                    path: tmp.substr(tmp.indexOf('/')),
                    port: (port[1] ? port[1] : defaultPort),
                    rejectUnauthorized: false,
                    headers: {
                        'host': `${host[0]}`
                    }
                }, (resp) => {
                    delete erroredNurls[nurl_];
                }).on('error', err => {
                    if (erroredNurls[nurl_]) erroredNurls[nurl_][1]++;
                }).end();
            } catch (e) {
                console.log(`callErroredNurls - ${e}`, host[0], erroredNurls[nurl_][3]);
            }

            if (erroredNurls[nurl_][1] > 8) {
                console.log(`${erroredNurls[nurl_][2]} Nurl call error ${erroredNurls[nurl_][0]}`);
                delete erroredNurls[nurl_];
            }
        }
    } catch (e) {
        console.error(`nurl err - ${e}`);
    }
}

setInterval(callErroredNurls, 10 * 1000);

function callNurl(data, type, hash) {
    let link = data[type];
    if (!link) return;
    const protocol = (link.indexOf('https') === 0 ? 'https' : 'http');
    const tmp = link.replace(/https:\/\/|http:\/\//, '');
    const host = tmp.split('/');

    const port = host[0].split(':');
    if (port[1]) host[0] = port[0];

    if (!nurls[host[0]]) {
        dns.lookup(host[0], function onLookup(err, addresses, family) {
            nurls[host[0]] = addresses;
        });
    }

    const requestModule = (protocol === 'https') ? https : http;
    const agent = (protocol === 'https') ? globalServices.keepaliveHttpsAgent : globalServices.keepaliveAgent;
    const defaultPort = (protocol === 'https') ? '443' : '80';
    let path = tmp.substr(tmp.indexOf('/')).replace(/\$\{AUCTION_ID\}/g, data['reqid']).replace(/\s/g, '%20');
    path = path.replace(/\$\{AUCTION_PRICE\}/g, data['dspSpend'].toString());
    path = path.replace(/%24%7BAUCTION_PRICE%7D/ig, data['dspSpend'].toString());

    try {
        requestModule.request({
            agent: agent,
            host: (nurls[host[0]] ? nurls[host[0]] : host[0]),
            path,
            port: (port[1] ? port[1] : defaultPort),
            rejectUnauthorized: false,
            headers: {'host': `${host[0]}`}
        }, (resp) => {
        }).on('error', err => {
            erroredNurls[hash] = [link.replace(/\$\{AUCTION_ID\}/g, data['reqid']).replace(/\$\{AUCTION_PRICE\}/g, data['dspSpend'].toString()).replace(/%24%7BAUCTION_PRICE%7D/ig, data['dspSpend'].toString()), 0, data['dsp']];
        }).end();
    } catch (err) {
        console.error(`call ${type} err - ${err}`);
        console.error("errrrrror - " + data['dsp'] + " - " + (nurls[host[0]] ? nurls[host[0]] : host[0]) + " - " + tmp.substr(tmp.indexOf('/')).replace(/\$\{AUCTION_ID\}/g, data['reqid']).replace(/\$\{AUCTION_PRICE\}/g, data['dspSpend'].toString()).replace(/%24%7BAUCTION_PRICE%7D/ig, data['dspSpend'].toString()));
    }
}

function win(req, res, url_) {
    const hash = url_[Config.hashParameter]
    redisClient.get(`nurl_${hash}`).then( async (data) => {
        if (data) {
            try {
                    data = JSON.parse(data)
                 } catch (e) {
                    console.error(`Error get nurl):`, err);
                    return
            }
            let winPrice = 0;
            winPrice = parseFloat(url_[Config.secondPriceParameter])
                let ADataObjectNurl = {
                    'request': data['a_request'],
                    'response': data['a_response'],
                    'type': data['type'],
                    'devicetype': data['devicetype'],
                    'dspId': data['dspId'],
                    'sspId': data['sspId'],
                    'dspspend': data['dspSpend'] / 1000,
                    'sspspend': parseFloat(winPrice) / 1000,
                    'repackCrid': data['repackCrid'],
                    'postDataString': data['a_postDataString'],
                    'sspTmax': data['a_sspTmax']
                };




                if (ServerConfig.analytics.nurls) {
                    insertNurlIntoMongo(ADataObjectNurl, ServerConfig.serverip)
                }

            //insertNurlIntoMongo(ADataObjectNurl)


            redisClient.del(`nurl_${hash}`);
        }
    })
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength('', 'utf8')
    });
    return res.end('');
}

function callLurl(req, res, url_) { //
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength('', 'utf8')
    });
    return res.end('');
}

function callBurl(req, res, url_) { //
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength('', 'utf8')
    });
    return res.end('');
}

const click = (req, res, url_) => {

    switch (url_[Config.trafficTypeParameter]) {
        case Config.banner:
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end('');
            break;
        case Config.native:
        case Config.video:
        default:
            echoEcho(res, '');
            break;
    }

    let hash = url_[Config.hashParameter];
    let memKey = `click_${hash}`;

    // globalServices.memcached.get(memKey, (err, data) => {
    redisClient.get(memKey, (err, data) => {
        console.log('click', data)
        if (err || !data) return;
        try {
            data = JSON.parse(data)
        } catch (e) {
            console.log(e)
            return
        }
        /* globalServices.memcached.del(memKey, (err) => {
            if (err) {
                console.error(`Error delete memcached (${memKey}, click):`, err);
                return;
            }
        });*/

        const requestSubtype = data['subType'] !== 'all' ? `${data['type']}_${data['subType']}` : data['type'];

        let detailedStatisticObject = {
            'click': 1,
            'id': `click_${data['id']}${hash}`,
            'sid': data['sid'],
            'siteid': data['realsid'],
            'dsp': data['dsp'],
            'sitename': data['domain'],
            'ssp': data['ssp'],
            'time': parseInt(Date.now() / 1000),
            'pid': data['pid'],
            'dspspend': data['dspSpend'] / 1000,
            'isApp': data['isApp'],
            'country': data['country'],
            'crid': data['crid'],
            'repackCrid': data['repackCrid'],
            'appBundle': data['bundle'],
            'width': data['w'],
            'height': data['h'],
            'type': requestSubtype,
            'bidPrice': data['price']
        };

        if (globalServices.cached.detailedStatistic) {
            globalServices.cached.detailedStatistic.insertOne(detailedStatisticObject, (err, res) => {
                if (err) {
                    console.error('Error insert to mongodb (detailed statistic):', err);
                    process.kill(process.pid, 'SIGTERM');
                }
            });
        }

    })
    return;
}

function impression(req, res, url_) {
    switch (url_[Config.trafficTypeParameter]) {
        case Config.banner:
            res.writeHead(200, {'Content-Type': 'image/gif'});
            res.end(Buffer.from(Config.imageHash, 'base64'));
            break;
        case Config.native:
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': Buffer.byteLength('', 'utf8')
            });
            res.end('');
            break;
        case Config.video:
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': Buffer.byteLength('', 'utf8')
            });
            res.end('');
            break;
        default:
            break;
    }

    let memKey = 'script_';

    if (url_[Config.extTracker] == 1 || url_['n'] == 1) memKey = 'imptrack_';

    //globalServices.memcached.get(`${memKey}${url_[Config.hashParameter]}`, (err, data) => {
    redisClient.get(`${memKey}${url_[Config.hashParameter]}`).then( data => {
        // if (err) {
        //     console.error(`Error get memcached (${memKey}, impression):`, err);
        //     return;
        // }
        if (data) {
            PrometheusService.getInstance().inc('impressions_hits');
        } else {
            PrometheusService.getInstance().inc('impressions_misses');
        }

        try {
            data = JSON.parse(data)
        } catch (e) {
            console.error(`Error get memcached (${memKey}, impression):`, err);
            return
        }
        if (data) {
            PrometheusService.getInstance().inc('impressions_by_ssp', {ssp_name: data['ssp']});
            PrometheusService.getInstance().inc('impressions_by_dsp', {dsp_name: data['dsp']});

            redisClient.set(`click_${url_[Config.hashParameter]}`, JSON.stringify(data), {'EX': 1 * 60 * 60})

            redisClient.del(`${memKey}${url_[Config.hashParameter]}`)

            let winPrice = 0;

            if (url_[Config.secondPriceParameter]) {
                if (url_[Config.secondPriceParameter] === '' || url_[Config.secondPriceParameter] === '${AUCTION_PRICE}' || Number.isNaN(parseFloat(url_[Config.secondPriceParameter]))) {
                    console.log(`${data['ssp']} - Problem with second price = ${url_[Config.secondPriceParameter]}`);
                    if (ServerConfig.writeProblemLog) {
                        let message = `${data['ssp']}|||Problem with second price|||Banner|||${data['pid']}|||${data['reqid']}|||${Date.now()}|||Price is sent like "${url_[Config.secondPriceParameter]}"`;
                        fs.appendFile('/nodejs/node_logs/detectedproblems' + new Date().toISOString().slice(0, 10) + '.txt', message + 'END\n', (err) => {});
                    }
                    url_[Config.secondPriceParameter] = data['price'] - (data['price'] / 3);
                }

                winPrice = parseFloat(url_[Config.secondPriceParameter]);

                if (winPrice - data['price'] > 0.01) {
                    if (ServerConfig.writeProblemLog) {
                        let message = `${data['ssp']}|||Win bid more or equal than bid price|||Banner|||${data['pid']}|||${data['reqid']}|||${Date.now()}|||WinPrice = ${winPrice}, BidPrice = ${data['price']}, RequestId = ${data['id']}`;
                        fs.appendFile('/nodejs/node_logs/detectedproblems' + new Date().toISOString().slice(0, 10) + '.txt', message + 'END\n', (err) => {});
                    }

                    Log('error', `Win more than bid price in impression function. SSP - ${data['ssp']}, win price - ${winPrice}, bid price - ${data['price']}, pubid - ${data['pid']}, request id - ${data['id']}`);
                    winPrice = 0;
                }

                if (data['nurlimpression'] !== 0 && url_[Config.extTracker] != 1) data['ssp'] += '_nopay';

		if (data['nurlimpression'] !== 0 && url_[Config.extTracker] == 1){
                    data['dsp'] += '_nopay';
                }
            }
            if (!(data['nurlimpression'] !== 0 && url_[Config.extTracker] == 1)){
                const hash = url_[Config.hashParameter]
                redisClient.get(`burl_${hash}`).then( async (redisData) => {
                    if (redisData) {
                        const burlObj = JSON.parse(redisData);
                        const burl = burlObj['burl'];

                        let winPrice = 0;
                        winPrice = parseFloat(url_[Config.secondPriceParameter])
                        let DataBurl = {
                            'request': data['a_request'],
                            'response': data['a_response'],
                            'type': data['type'],
                            'devicetype': data['devicetype'],
                            'dspId': data['dspId'],
                            'sspId': data['sspId'],
                            'dspspend': data['dspSpend'] / 1000,
                            'sspspend': parseFloat(winPrice) / 1000,
                            'repackCrid': data['repackCrid'],
                            'postDataString': data['a_postDataString'],
                            'sspTmax': data['a_sspTmax'],
                            'burl': burl
                        };

                        if (ServerConfig.analytics.burls) {
                            insertBurlIntoMongo(DataBurl, ServerConfig.serverip)
                        }

                        const protocol = (burl.indexOf('https') === 0 ? 'https' : 'http');
                        const tmp = burl.replace(/https:\/\/|http:\/\//, '');
                        const host = tmp.split('/');

                        const port = host[0].split(':');
                        if (port[1]) host[0] = port[0];

                        if (!burls[host[0]]) {
                            // dns.lookup(host[0], function onLookup(err, addresses, family) {
                            //     burls[host[0]] = addresses;
                            // });
                            try {
                                 burls[host[0]] = await lookupPromise();
                            } catch(err) {
                                 console.error(err);
                            }
                        }

                        //const requestModule = (protocol === 'https') ? https : http;
                        const requestModule = http;
                        //const agent = (protocol === 'https') ? globalServices.keepaliveHttpsAgent : globalServices.keepaliveAgent;
                        //const defaultPort = (protocol === 'https') ? '443' : '80';
                        const defaultPort = '80';
                        let path = tmp.substr(tmp.indexOf('/'))
                        path = path.replace(/\$\{AUCTION_PRICE\}/g, data['dspSpend'].toString());
                        path = path.replace(/%24%7BAUCTION_PRICE%7D/ig, data['dspSpend'].toString());

                        try {
                            const request = requestModule.request({
                                //agent: agent,
                                host: (burls[host[0]] ? burls[host[0]] : host[0]),
                                path,
                                port: defaultPort,
                                timeout: 300,
                                rejectUnauthorized: false,
                                headers: {'host': `${host[0]}`}
                            }, (resp) => {
                            });
                            request.on('error', function (e) {
                                // General error, i.e.
                                //  - ECONNRESET - server closed the socket unexpectedly
                                //  - ECONNREFUSED - server did not listen
                                //  - HPE_INVALID_VERSION
                                //  - HPE_INVALID_STATUS
                                //  - ... (other HPE_* codes) - server returned garbage
                                console.log(e);
                            });

                            request.on('timeout', () => {
                                request.destroy();
                            });
                            request.end();
                        } catch (err) {
                            console.error(`Error call burl ${err}`);
                        }
                        redisClient.del(`burl_${hash}`);
                    }
                })
            }

            const subtype = data['subType'] !== 'all' ? `${data['type']}_${data['subType']}` : data['type'];
            const source = data['isApp'] == 1 ? data['bundle'] : data['domain'];

            let detailedStatisticObject = {
                'id': `${data['id']}${url_[Config.hashParameter]}`,
                'sid': data['sid'],
                'siteid': data['realsid'],
                'dsp': data['dsp'],
                'sitename': data['domain'],
                'ssp': data['ssp'],
                'time': parseInt(Date.now() / 1000),
                'pid': data['pid'],
                'dspspend': data['dspSpend'] / 1000,
                'isApp': data['isApp'],
                'country': data['country'],
                'crid': data['crid'],
                'repackCrid': data['repackCrid'],
                'appBundle': data['bundle'],
                'width': data['w'],
                'height': data['h'],
                'type': subtype,
                'bidPrice': data['price']
            };

            let checker = parseFloat(winPrice);
            if (winPrice != checker) winPrice = data['dspSpend'] / 3;

            if (url_[Config.secondPriceParameter]) detailedStatisticObject['spend'] = parseFloat(winPrice) / 1000;

            const sspStatUnit = new SSPStatsUnitModel(source, data['sspId'], data['dspId'], data['originalPid'], data['type'],
                data['w'], data['h'], data['country'], data['subType'], data['isApp'], data['devicetype'], data['crid'], Config.sspInfoKeys.IMPRESSION);

            // Vova_cleanup
            // sspRequestStatsService.incrementSSPInfoStatus(sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.IMPRESSION);

            sspStatUnit.setStatus(Config.sspInfoKeys.DSP_SPEND);
            // Vova_cleanup
            // sspRequestStatsService.incrementSSPInfoStatusWithValue(sspStatUnit.getRequestDimensionsArray(),
            //    Config.sspInfoKeys.DSP_SPEND, detailedStatisticObject['dspspend']);

            sspStatUnit.setStatus(Config.sspInfoKeys.SSP_SPEND);

            // Vova_cleanup
            // sspRequestStatsService.incrementSSPInfoStatusWithValue(sspStatUnit.getRequestDimensionsArray(),
            //     Config.sspInfoKeys.SSP_SPEND, detailedStatisticObject['spend']);





                if (ServerConfig.analytics.impressions) {
                    let ADataObject = {
                        'request': data['a_request'],
                        'response': data['a_response'],
                        'type': data['type'],
                        'devicetype': data['devicetype'],
                        'dspId': data['dspId'],
                        'sspId': data['sspId'],
                        'dspspend': data['dspSpend'] / 1000,
                        'sspspend': parseFloat(winPrice) / 1000,
                        'repackCrid': data['repackCrid'],
                        'postDataString': data['a_postDataString'],
                        'sspTmax': data['a_sspTmax']
                    };
                    insertImprIntoMongo(ADataObject, ServerConfig.serverip)
                }


            // let ADataObject = {
            //     'request': data['a_request'],
            //     'response': data['a_response'],
            //     'type': data['type'],
            //     'devicetype': data['devicetype'],
            //     'dspId': data['dspId'],
            //     'sspId': data['sspId'],
            //     'dspspend': data['dspSpend'] / 1000,
            //     'sspspend': parseFloat(winPrice) / 1000
            // };
            // insertImprIntoMongo(ADataObject)

            if (globalServices.cached.detailedStatistic) {
                globalServices.cached.detailedStatistic.insertOne(detailedStatisticObject, (err, res) => {
                    if (err) {
                        console.error('Error insert to mongodb (detailed statistic):', err);
                        process.kill(process.pid, 'SIGTERM');
                    }
                });
            }

            let generalStatisticObject = {
                'id': `${data['id']}${url_[Config.hashParameter]}`,
                'time': Math.floor(Date.now() / 1000),
                'ssp': data['ssp'],
                'dsp': data['dsp'],
                'ourwinprice': data['dspSpend']
            };

            if (url_[Config.secondPriceParameter]) generalStatisticObject['winprice'] = parseFloat(winPrice);

            if (globalServices.cached.impressions) {
                globalServices.cached.impressions.insertOne(generalStatisticObject, (err, res) => {
                    if (err) {
                        console.error('Error insert to mongodb (impressions):', err);
                        process.kill(process.pid, 'SIGTERM');
                    }
                });
            }

            if (data['nurl'] !== '' && data['nurl'] !== 'undefined' && data['nurl'] !== 'null') {
                callNurl(data, 'nurl', url_[Config.hashParameter]);
            }
        }
    })
};

/* VOVA remove adapter*/
function getAdapterKeys() {
    globalServices.AerospikeClient.connect(err => {
        let temp = {};
        let scan = globalServices.AerospikeClient.scan(Config.adapterSettings.namespace, `${Config.adapterSettings.set}${ServerConfig.region}`);
        scan.concurrent = true;
        scan.priority = Aerospike.scanPriority.LOW;
        let stream = scan.foreach();
        stream.on('data', record => {
            temp[record['bins']['key']] = true;
        });
        stream.on('error', err_);
        stream.on('end', () => {
            fs.writeFile(Config.adapter, JSON.stringify(temp), (err) => {
                if (err) {
                    console.log('Errror write adapter', err);
                } else {
                    process.send({'name': Config.API.adapter, 'val': 'file'});
                }
            });
        });
    })
}

if (globalStorage.cluster_config.pid == 5) {
    getAdapterKeys();
    setInterval(() => {
        getAdapterKeys();
    }, 75 * 1000);
}

setInterval(() => {
    let keys = Object.keys(cacheTMTDomains);
    let l = keys.length;
    let date_ = Date.now() / 1000;
    for (let i = 0; i < l; i++) {
        if (cacheTMTDomains[keys[i]][1] < date_) {
            delete cacheTMTDomains[keys[i]];
        }
    }
}, Config.TmtDomainsCacheTime);

function writeCachedTagsNew() {
    globalServices.cached.updateCridData.insertOne(updateCridData, empf);
    updateCridData = {};
}
setInterval(writeCachedTagsNew, 5 * 60 * 1000);
/////////////////////////////
let isWriteNurls = false;
let nurls = {};
let isWriteBurls = false;
let burls = {};

function getBurls() {
    async.forEachOf(burls, function (value, key, callback) {
        dns.lookup(key, function onLookup(err, addresses, family) {
            burls[key] = addresses;
            callback();
        });
    }, function (err) {
        if (err) console.error(err.message);

        if (globalStorage.cluster_config.pid == 4 && isWriteBurls === true) {
            fs.writeFile(Config.listBURL, JSON.stringify(burls, null, "\t\t"), function (err) {
                if (err) console.error('error getBurls():', err);
            });
        }
        isWriteBurls = true;
    });
}


function getNurls() {
    async.forEachOf(nurls, function (value, key, callback) {
        dns.lookup(key, function onLookup(err, addresses, family) {
            nurls[key] = addresses;
            callback();
        });
    }, function (err) {
        if (err) console.error(err.message);

        if (globalStorage.cluster_config.pid == 4 && isWriteNurls === true) {
            fs.writeFile(Config.listNURL, JSON.stringify(nurls, null, "\t\t"), function (err) {
                if (err) console.error('error getNurls():', err);
            });
        }
        isWriteNurls = true;
    });
}

fs.readFile(Config.listBURL, function (err, data) {
    if (err) {
        console.error(`error readFile: ${Config.listBURL}`, err);
        fs.writeFile(Config.listBURL, '{}', function (err) {});
        burls = {};
    } else {
        try {
            if (data !== undefined && data !== '') {
                try {
                    burls = JSON.parse(data);
                } catch (e) {
                    burls = {};
                }
                getBurls();
            }
        } catch (e) {
            console.error('Error get Burls');
        }
    }
    setInterval(getBurls, 500 * 1000);
});

fs.readFile(Config.listNURL, function (err, data) {
    if (err) {
        console.error(`error readFile: ${Config.listNURL}`, err);
        fs.writeFile(Config.listNURL, '{}', function (err) {});
        nurls = {};
    } else {
        try {
            if (data !== undefined && data !== '') {
                try {
                    nurls = JSON.parse(data);
                } catch (e) {
                    nurls = {};
                }
                getNurls();
            }
        } catch (e) {
            console.error('Error get Nurls');
        }
    }
    setInterval(getNurls, 500 * 1000);
});

function clearAdapterPerformer() {
    adapterPerformer = {};
}
setInterval(clearAdapterPerformer, 60 * 1000);

////////////////////////// PASER
function clearPaser() {
    async.each(Object.keys(globalStorage.dspPartners), (key, cb) => {
        if (globalStorage.adapterPoints[key] < 20) {
            globalStorage.adapterPoints[key] += globalStorage.adapterIncreaseRate[key];
        }
        globalStorage.dspPartners[key]['passer'] = 0;
        cb();
    }, err_);
}

setInterval(clearPaser, 1000);

/*function getiurls() {
    globalServices.cached.iurltags.find().toArray((err, data) => {
        if (err) {
            console.error(err);
        } else {
            iurltags = {};
            for (let i = 0; i < data.length; i++) {
                iurltags[data[i]['_id']] = true;
            }
        }
    });
}*/

/*function setiurls() {
    if (iurltagslearn) {
        let keys = Object.keys(iurltagslearn);
        let arr_to_put = [];
        for (let i = 0; i < keys.length; i++) {
            arr_to_put.push({"_id": keys[i], "adm": iurltagslearn[keys[i]], "date": Math.floor(Date.now() / 1000)});
            iurltags[keys[i]] = true;
        }
        if (arr_to_put.length > 0)
            globalServices.cached.iurltags.insertMany(arr_to_put, empf);

        let t = Math.floor(Date.now() / 1000) - (86400 * 2);
        globalServices.cached.iurltags.deleteMany({date: {$lt: t}}, err_);

    }
    iurltagslearn = {};
}*/

/*if (globalStorage.cluster_config.pid == 4) {
    setTimeout(() => {
        setInterval(setiurls, 15 * 60 * 1000);
    }, 5000);
    setTimeout(() => {
        setInterval(getiurls, 15 * 60 * 1000);
    }, 60000);
}*/

//////////////////////////////////////////////////INIT
const server = ServerConfig.server;
const serverssl = ServerConfig.serverssl;
const statpass = Config.statPassword;

globalServices.userSync.setMemcachedInstance(globalServices.memcached);
let CoreQPS = {}; //Queries-per-Second Core
let CountryCoreQPS = {'writeObj': 1}; //Country Queries-per-Second Core (write 1)

function empf(err, res) {

    if (err) {
        console.error(`empf(), ${err}`);
        console.log(res)
    }
}

function memcachedCallbackLOCAL(err) {
    if (err) {
        console.error(`memcachedCallbackLOCAL() err: ${err}`);
        console.log(err.stack)
    }
}

function err_(err) {
    if (err) console.error(`err_, ${err}`);
}

/////////////////FUNCTIONS

function getMethod(url_, path) {
    if (path === '/vast') {
        return 'vast';
    } else if (path === '/click') {
        return 'click';
    } else if (url_[Config.typeParameter] !== undefined) {
        if (url_[Config.typeParameter] === Config.impression) {
            return 'impression';
        } else if (url_[Config.typeParameter] === Config.lurl) {
            return 'lurl';
        } else if (url_[Config.typeParameter] === Config.nurl) {
            return 'win';
        } else if (url_[Config.typeParameter] === Config.burl) {
            return 'burl';
        }
    } else if (url_['t'] !== undefined && url_['t'] !== '') {
        if (url_['t'] === 'preview' && url_['k'] !== undefined) {
            return 'showPreview';
        } else if (url_['t'] === 'preview2' && url_['k'] !== undefined) {
            return 'showPreviewFull';
        } else if (url_['t'] === 'sbid' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'showBids';
        } else if (url_['t'] === 'sspqps' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getAvrBidQpsSSP';
        } else if (url_['t'] === 'qps' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getAvrQPS';
        } else if (url_['t'] === 'realqps' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getAvrRealQpsDSP';
        } else if (url_['t'] === 'bidqps' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getAvrBidQpsDSP';
        } else if (url_['t'] === 'maxqps' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getAvrMaxQpsDSP';
        } else if (url_['t'] === 'countryqps' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getCountryAvrQPS';
        } else if (url_['t'] === 'sspmatchrates' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getSSPsMatchRates';
        } else if (url_['t'] === 'dspmatchrates' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getDSPsMatchRates';
        } else if (url_['t'] === 'getlog' && url_['k'] !== undefined && url_['k'] === statpass) {
            return 'getLog';
        } else if (url_['t'] === 'getfile' && url_['k'] !== undefined) {
            return 'getfile';
        }
    }
    return 'none';
};

//////LIMIT CLEANER
function checklimit() {
    async.each(Object.keys(globalStorage.dspPartners), (i, cb) => {
        if (globalStorage.dspPartners[i]['limit'] > 0 && (globalStorage.dspPartners[i]['limit'] / globalStorage.dspPartners[i]['sendreq']) * 100 >= Config.timeoutPerc) {
            globalStorage.dspPartners[i]['blocked'] = parseInt(Date.now());
        }
        if (globalStorage.dspPartners[i]['limit'] > 0 && ((globalStorage.dspPartners[i]['sendreq'] >= 10 && globalStorage.dspPartners[i]['limit'] >= ((globalStorage.dspPartners[i]['sendreq']) / (100 / Config.timeoutPerc))) || globalStorage.dspPartners[i]['limit'] >= Config.timeoutStaticCount)) {
            //console.log("!!! blocked"+" - "+i + " - "+globalStorage.dspPartners[i]['limit']);
            if (globalStorage.dspPartners[i]['limit'] >= ((globalStorage.dspPartners[i]['sendreq']) / (100 / 99))) {
                // console.log("HARD TIMEOUT");
                globalStorage.dspPartners[i]['blocked'] = parseInt(Date.now()) + 60000;
            } else
                globalStorage.dspPartners[i]['blocked'] = parseInt(Date.now());
        }
        globalStorage.dspPartners[i]['limit'] = 0;
        globalStorage.dspPartners[i]['sendreq'] = 0;

        if (globalStorage.dspPartners[i]['blocked'] !== undefined && globalStorage.dspPartners[i]['blocked'] <= (parseInt(Date.now()) - 120000))
            globalStorage.dspPartners[i]['blocked'] = undefined;
        cb();
    }, err_);
}

setTimeout(() => {
    setInterval(checklimit, 10000);
}, 70000);

function Filters(adsConfig, request, dsp, ssp, device, adaptKeyDsp, publisherId, bf, userId, siteAppСats, siteAppName, source, platformType) {
    let currentDsp = globalStorage.dspPartners[dsp];
    //vovafixME ADAPTER
    if (ssp.id !== 319 && currentDsp['adaptraffic'] === 1 && adapterdsp[adaptKeyDsp] === undefined) {
        // if (currentDsp['id'] == 30020) {
        //     console.log(`adapter points ${globalStorage.adapterPoints[dsp]}  preformer: ${adapterPerformer[adaptKeyDsp]}`)
        // }
        if (globalStorage.adapterPoints[dsp] < 1 || adapterPerformer[adaptKeyDsp] === true) {

            return `adapter`;
        } else {
            adapterPerformer[adaptKeyDsp] = true;
            globalStorage.adapterPoints[dsp]--;
        }
    }
    if (currentDsp['passer'] >= currentDsp['passerLimit']) {
        return `passer limit violated`;
    }
    if (currentDsp['blockedSSP'][ssp['id']]) {
        return `SSP id: ${ssp.id} blocked at ${currentDsp.id}`;
    }
    // if (currentDsp['blocked']) {
    //     return `DSP: ${currentDsp['id']} is blocked`;
    // }
    if (ssp['allowedDSP'].length > 0 && ssp['allowedDSP'][currentDsp['id']] === undefined) {
        return `DSP: ${currentDsp.id} didn't allowed at SSP: ${ssp.id}`;
    }
    if (currentDsp['allowedSSP'].length > 0 && currentDsp['allowedSSP'][ssp['id']] === undefined) {
        return `SSP: ${ssp.id} didn't allowed at DSP: ${currentDsp.id}`;
    }
    if (blockedPublishers[currentDsp['id']] && blockedPublishers[currentDsp['id']][publisherId.toLowerCase()]) {
        return `Current publisher: ${publisherId} are blocked`;
    }
    if (currentDsp['allowedCountries'].length > 0 && currentDsp['allowedCountries'][device['geo']['country']] === undefined) {
        return `At DSP: ${currentDsp.id} doesn't match device country at allowed countries`;
    }
    if (currentDsp['blockedCountries'].length > 0 && currentDsp['blockedCountries'][device['geo']['country']] === true) {
        return `At DSP: ${currentDsp.id} doesn't match device country at blocked countries`;
    }
    if (platformType === 'site') {
        // if (currentDsp['matchedUsersOnly'] && !(adsConfig.syncedDspKeys[dsp] && adsConfig.syncedDspKeys[dsp].buyeruid)) {
        //     return `matchedUsersOnly`;
        // }
        if (currentDsp['requserid'] === 1 && userId == '') {
            return `user id emty`;
        }
        if (allowedSites[dsp] !== undefined && allowedSites[dsp][siteAppName.toLowerCase()] === undefined) {
            return `allowedSites`;
        }
        if (blockedSites[dsp] !== undefined && blockedSites[dsp][source.toLowerCase()] !== undefined) {
            return `blockedSites`;
        }
    } else {
        if (allowedBundles[dsp] !== undefined && allowedBundles[dsp][source] === undefined) {

            // console.log('INSIDE ALLOWED BUNDLES FOR ', allowedBundles[dsp])
            return `allowedBundles`;
        }
        // if (allowedPublishers[dsp] !== undefined && allowedPublishers[dsp][publisherId.toLowerCase()] === undefined) {
        //     return `allowedPublishers`;
        // }
        if (blockedAppNames[dsp] !== undefined && blockedAppNames[dsp][siteAppName.toLowerCase()] !== undefined) {
            return `blockedAppNames`;
        }
        if (blockedBundles[dsp] !== undefined && (!source || blockedBundles[dsp][source.toLowerCase()] !== undefined)) {
            return `blockedBundles`;
        }
    }

    if (currentDsp['tmax'] > 0 && request['tmax'] < currentDsp['tmax']) {
        return `tmax greater than the minimum`;
    }
    if (currentDsp['secureprotocol'][request['imp'][0]['secure']] != 'true') {
        return `HTTP protocol issue`;
    }
    if (currentDsp['intstl'] === 1 && request['imp'][0]['instl'] != 1) {
        return `request is not interstitial`;
    }
    if (currentDsp['maxbidfloor'] > 0 && currentDsp['maxbidfloor'] < bf) {
        return `max bidfloor`;
    }
    if (currentDsp['minbidfloor'] > 0 && currentDsp['minbidfloor'] > bf) {
        return `min bidfloor`;
    }
    if (currentDsp['reqcarrier'] === 1 && !device['carrier']) {
        return `carrier field is empty`;
    }
    if (currentDsp['reqpubid'] === 1 && publisherId === '') {
        return `publisherId is empty`;
    }
    if (currentDsp['conntp']['length'] > 0 && !currentDsp['conntp'][device['connectiontype']]) {
        return `connectionTypes`;
    }
    if (currentDsp['blockedcat'].length > 0) {
        let l = currentDsp['blockedcat'].length;
        for (let i = 0; i < l; i++) {
            if (siteAppСats.indexOf(currentDsp['blockedcat'][i]) !== -1) {
                return `blockedCat`;
            }
        }
    }
    if (allowedCarriers[dsp]) {
        if (device['carrier']) {
            let reg = new RegExp(allowedCarriers[dsp], "i");
            if (reg.test(device['carrier']) !== true) {
                return `allowedCarriers`;
            }
        } else {
            return `allowedCarriers`;
        }
    }
    if (!(excludeSSP[currentDsp['id']] && excludeSSP[currentDsp['id']][ssp['id']]) && !(excludeSSP[0] && excludeSSP[0][ssp['id']] === true)) {
        if ((currentDsp['trafquality']['PXW'] && (currentDsp['fraudPercPX'] < adsConfig.percentPixalateFraud || adsConfig.percentPixalateFraud === undefined)) ||
            (!currentDsp['trafquality']['PXW'] && currentDsp['trafquality']['PXB'] && currentDsp['fraudPercPX'] < adsConfig.percentPixalateFraud)
        ) {
            return `pixalatePercents`;
        }
    }
    if (adsConfig.size !== undefined && allowedSizes[dsp] && allowedSizes[dsp][adsConfig.size] === undefined) {
        return `allowedSizes`;
    }
    if (adsConfig.type === 'video' && currentDsp['rewarded'] === 1 && !adsConfig.rewarded) {
        return `rewarded`;
    }

    return DSPConnectors.checkDSPRequestRequirements(dsp, request, device, adsConfig.type);
};

// setInterval(addBidReqMongo, 60 * 1000);
// setInterval(addBidResMongo, 60 * 1000);
// setInterval(addNurlMongo, 60 * 1000);
// setInterval(addImprMongo, 60 * 1000);
// setInterval(addOurBidReqMongo, 60 * 1000);

if (ServerConfig.analytics.bidRequests) {
    setInterval(addBidReqMongo, 60 * 1000);
}
if (ServerConfig.analytics.ourBidRequests) {
    setInterval(addOurBidReqMongo, 60 * 1000);
}
if (ServerConfig.analytics.impressions) {
    setInterval(addImprMongo, 60 * 1000);
}
if (ServerConfig.analytics.nurls) {
    setInterval(addNurlMongo, 60 * 1000);
}
if (ServerConfig.analytics.bidResponses) {
    setInterval(addBidResMongo, 60 * 1000);
}
if (ServerConfig.analytics.burls) {
    setInterval(addBurlMongo, 60 * 1000);
}


function prepareBidRequest(response, request, sspPartner, ext, platformType, type) {

    let sspTmax = request.tmax
    let postDataString = '';
    let passbackBid = {};
    let badtraffic = false;
    let percentPixalateFraud;
    let siteApp = {};
    let device;
    let adaptkey = '';
    let rewarded = false;
    let trafftype = '';
    let originalPubId = 'none';
    let isCTV = false;
    let vastDSP = [];

    if (request['tmax'] && request['tmax'] < Config.mintmax) return echoNoBidEnd(response);

    device = Prepare.device(request);
    if (device === false) return echoNoBidEnd(response);
    isCTV = device['devicetype'] == 3 || device['devicetype'] == 6 || device['devicetype'] == 7;

    if (platformType === 'site') {
        siteApp = Prepare.site(request, sspPartner['id']);
        if (blockedSitesGlobal[siteApp['domain']]) return echoNoBidEnd(response);
    } else if (platformType === 'app') {
        siteApp = Prepare.app(request, sspPartner['id'], device);
        if (!siteApp || blockedAppsGlobal[siteApp['bundle']]) return echoNoBidEnd(response);
        badtraffic = request._isBadTrafic;
    }

    if (siteApp === false) return echoNoBidEnd(response);

    if (request[platformType]['publisher'] && request[platformType]['publisher']['id']) {
        originalPubId = request[platformType]['publisher']['id'].toString();
    }

    if (blockedSSPPubs[sspPartner.id] && blockedSSPPubs[sspPartner.id][originalPubId]) {
        return echoNoBidEnd(response);
    }

    const source = platformType === 'site' ? siteApp['domain'] : siteApp['bundle'];
    const siteAppName = platformType === 'site' ? siteApp['domain'] : siteApp['name'];



        if (ServerConfig.analytics.bidRequests) {
            insertBidRequestIntoMongo(request, sspPartner, type, device['devicetype'], ServerConfig.serverip, sspTmax)
        }


    //insertBidRequestIntoMongo(request, sspPartner, type, device['devicetype'])


    if (!request['imp'][0]['id']) request['imp'][0]['id'] = 1;
    if (!request['imp'][0]['secure']) request['imp'][0]['secure'] = 0;

    if (sspPartner['tmax'] > 0) request['tmax'] = sspPartner['tmax'];
    request['tmax'] = (request['tmax'] ? request['tmax'] - Config.descreasetmaxby : Config.defaulttmax[type]);
    if (request['tmax'] > 160) request['tmax'] -= 5;
    if (request['tmax'] > 200) request['tmax'] -= 15;
    if (request['tmax'] > 500) request['tmax'] = 500;

    if (request['tmax'] && request['tmax'] < Config.mintmax) return echoNoBidEnd(response);
    request.tmax = Math.floor(request.tmax);

    let bidfloor = parseFloat(request['imp'][0]['bidfloor']) ? parseFloat(request['imp'][0]['bidfloor']) : Config.minbidfloor[type];

    bidfloor = Math.max(bidfloor, sspPartner['minbfloor']);
    bidfloor = Math.ceil(bidfloor * 100000) / 100000;

    let requestId = Functions.requestIdModify(sspPartner, request); // default string
    let impressionId = Functions.impressionIdModify(); // default ""
    let bcat = Functions.bcatModify(request); // default []
    let userId = globalServices.userSync.getUserId(request);
    let battr = Functions.battrModify(request, type);
    let subType = Functions.getSubType(request, device['devicetype'], type, isCTV);

    percentPixalateFraud = Functions.getFraudPercent(pixalateKeys, `${sspPartner['company']}|${siteApp.publisher.id}|${source}|${type}`);

    //check porn
    if (siteApp['cat'].indexOf('IAB25-3') !== -1 || /porn|xxx|fuck|lesbian|hentai|tits|bdsm|cekc|sex|erotic|fetish|adult|pussy|milf|nude|nudity/i.test(siteAppName) ||
        pornList[siteAppName] !== undefined ||
        pornList[source] !== undefined) return echoNoBidEnd(response);

    let isApp = platformType === 'app' ? 1 : 0;
    if (isApp) {
        if (isCTV) trafftype = 4;
        else trafftype = 3;
    } else if (device['devicetype'] === 2) {
        trafftype = 2;
    } else {
        trafftype = 1;
    }

    if (checkTypeTraf) {
        if (!typeTraf[type][platformType]) typeTraf[type][platformType] = {};
        typeTraf[type][platformType][sspPartner['name']] = trafftype;
    }

    let size = `${request['imp'][0][type]['w']}x${request['imp'][0][type]['h']}`;

    switch (type) {
        case 'banner':
            let floorkeyprice = parseInt(bidfloor * 10);
            if (floorkeyprice > 3) floorkeyprice -= floorkeyprice % 3;
            adaptkey = `${device['geo']['country']}|${request['imp'][0][type]['w']}|${request['imp'][0][type]['h']}|${device['devicetype']}|${(platformType === 'app' ? 1 : 0)}|${(request['imp'][0]['secure'] == 1 ? 1 : 0)}|${(request['imp'][0]['instl'] ? request['imp'][0]['instl'] : 0)}|${device['connectiontype']}|${device['os']}|${source.toLowerCase()}|${floorkeyprice}`;
            break;
        case 'video':
            if (request['imp'][0][type]['minduration'] > 1000) request['imp'][0][type]['minduration'] = 0;
            adaptkey = `${device['geo']['country']}|${request['imp'][0][type]['w']}|${request['imp'][0][type]['h']}|${device['devicetype']}|${(platformType === 'app' ? 1 : 0)}|${(request['imp'][0]['secure'] == 1 ? 1 : 0)}|${device['connectiontype']}|${device['os']}|${parseFloat(bidfloor).toFixed(1)}|${type}`;
            if (request['imp'][0]['video']['ext'] && (request['imp'][0]['video']['ext']['videotype'] == 'rewarded' || request['imp'][0]['video']['ext']['rewarded'] == 1)) rewarded = true;
            break;
        case 'native':
            request['imp'][0]['native'] = nativeModule.getValidatedSSPImp(request['imp'][0]['native'], sspPartner, request);
            if (request['imp'][0]['native'] === false)  return echoNoBidEnd(response);
            size = 'no';
            adaptkey = `${device['geo']['country']}|${device['devicetype']}|${(platformType === 'app' ? '1' : '0')}|${(request['imp'][0]['secure'] == 1 ? '1' : '0')}|${device['connectiontype']}|${device['os']}|${parseFloat(bidfloor).toFixed(1)}|${type}`;
            break;
        case 'audio':
            size = 'no';
            adaptkey = `${device['geo']['country']}|${device['devicetype']}|${(platformType === 'app' ? '1' : '0')}|${(request['imp'][0]['secure'] == 1 ? '1' : '0')}|${device['connectiontype']}|${device['os']}|${parseFloat(bidfloor).toFixed(1)}|${type}`;
            break;
        default:
            break;
    }

    let qpsKey = `${device['geo']['country']}|${trafftype}|${size}|${type}|${region}|${subType}`;
    Functions.addCountryCoreBidQps(CountryCoreQPS, qpsKey);

    const winKey = `${sspPartner['name']}|${siteApp['publisher']['id']}|${source}|${type === 'video' && subType !== 'all' ? `${type}_${subType}` : type}`;
    const minbidexitprice = siteAVGPrice[winKey] || Config.minbidexitprice[type]['price'];

    /*************** AUTOMATIC LOG ***************/
    //#region AUTOMATIC LOG
    if (logWrite && Object.keys(logParameters).length > 0 && logParameters['type'].includes(type)) {
        let params_obj = {
            objDeviceGeo: device['geo'],
            site_app_id: siteApp.id,
            site_app_name: siteAppName,
            device_carrier: device['carrier'],
            device_os: device['os'],
            device_ifa: device['ifa'],
            device_connection_type: device['connectiontype'],
            bf: bidfloor,
            trafftype: trafftype,
            cats: siteApp.cat,
            rewarded: rewarded,
            size: size,
            percentPixalateFraud: percentPixalateFraud
        };

        Functions.automaticLog(logParameters, logObject, request, sspPartner, params_obj, type);
    }
    //#endregion
    let alreadyansw = false;
    const requestsByNativeSpec = {};

    const placementParams = {bcat, battr, siteApp, platformType, device, userId, impressionId, requestId, size, isCTV, type};
    const mainBidRequest = Functions.makePostObject(request, placementParams, sspPartner.partnerid);

    const dspPreSetKey = Functions.getDspPreSetKey(type, trafftype, badtraffic, device);
    

    if (!globalStorage.dspPreSetSettings[dspPreSetKey]) return echoNoBidEnd(response);

    let iteratorLengthLast = globalStorage.dspPreSetSettings[dspPreSetKey].length;
    const sendDSPArr = new Set();

    function asyncCallback(isstop = false) {
        if (alreadyansw === false && (isstop === true || --iteratorLengthLast === 0)) {
            clearTimeout(mainTimeout);
            alreadyansw = true;

            const dspId = globalStorage.dspPartners[passbackBid['dsp']] ? globalStorage.dspPartners[passbackBid['dsp']]['id'] : 0;

            if (!passbackBid.dsp) {
                if (type === 'video') {
                    passbackBid = vast.getVastBid(request, sspPartner, reqResStorage, vastDSP);
                    if (!passbackBid.dsp) return echoNoBidEnd(response);
                    addCountCoreRealQpsDSP(passbackBid.dsp);
                } else {
                    return echoNoBidEnd(response);
                }
            }

            let oldp = passbackBid['data']['seatbid'][0]['bid'][0]['price'];
            passbackBid['data']['seatbid'][0]['bid'][0]['price'] = (oldp - (oldp * (passbackBid['margin'] / 100))).toFixed(5);

            if (!passbackBid['isVast'] && siteAVGPrice[`${winKey}`] && siteAVGPrice[`${winKey}`] < passbackBid['data']['seatbid'][0]['bid'][0]['price'] && siteAVGPrice[`${winKey}`] > bidfloor) {
                passbackBid['data']['seatbid'][0]['bid'][0]['price'] = siteAVGPrice[`${winKey}`];
            }

            let percprice = passbackBid['data']['seatbid'][0]['bid'][0]['price'];

            let resp = prepareBidResponse(passbackBid, sspPartner, request, oldp, bidfloor, trafftype, siteAppName, siteApp.id,
                siteApp.publisher.id, impressionId, requestId, percprice, source, type, device, subType, originalPubId, ext, postDataString, sspTmax);

            if (resp === false) return echoNoBidEnd(response);

            globalServices.cached.responseimpressions.updateOne({
                'ssp': sspPartner['name'],
                'dsp': passbackBid['dsp']
            }, {
                $inc: {
                    'cnt': 1,
                    'bidprice': oldp / 1000,
                    'ourbidprice': passbackBid['data']['seatbid'][0]['bid'][0]['price'] / 1000
                }
            }, {upsert: true, safe: false}, empf);

            // qps test
	    addCountCoreQpsSSP(sspPartner['name']);

            reqResStorage.save('ownBidResponse', sspPartner.id, resp);

            const sspStatUnit = new SSPStatsUnitModel(source, sspPartner.id, dspId, originalPubId, type,
                request['imp'][0][type]['w'] || 0, request['imp'][0][type]['h'] || 0, device['geo']['country'], subType, isApp,
                device['devicetype'], passbackBid['data']['seatbid'][0]['bid'][0]['crid'], Config.sspInfoKeys.BID_SENT_TO_SSP);

            // Vova_cleanup
            // sspRequestStatsService.incrementSSPInfoStatus(
            //    sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.BID_SENT_TO_SSP
            // );

            if (ext['integrationType']) {
                switch (ext['integrationType']) {
                    case 'vast':
                        return echoGoodEndXml(response, JSON.parse(resp).seatbid[0].bid[0].adm);
                    default:
                        return echoNoBidEnd(response);
                }
            } else {
                if (sspPartner.gzipResponses == 1 && ext.reqHeaders['accept-encoding'] === 'gzip') {
                    makeResponseGzipEncoding(resp, (err, encodedResp) => {
                        if (err) {
                            console.error(`Error gzip encoding for DSP response. DSP name - ${passbackBid['dsp']}, SSP name - ${sspPartner.name}, ${err}`);
                            return echoGoodEnd(response, resp);
                        } else {
                            return echoGzipResponse(response, encodedResp);
                        }
                    });
                } else {
                    return echoGoodEnd(response, resp);
                }
            }
        }
    };

    let mainTimeout = setTimeout(() => {
        asyncCallback(true);
        sendDSPArr.forEach((dsp) => {
            if (globalStorage.dspPartners[dsp]) {
                globalStorage.dspPartners[dsp]['limit']++;
                dspInfoService.addEvent(globalStorage.dspPartners[dsp]['id'], 'timeouts');
            }
        });
    }, parseInt(request['tmax']));

    const syncedDspKeys = {};

    
    for (let i = 0; i < globalStorage.dspPreSetSettings[dspPreSetKey].length; i++) {
        const key = globalStorage.dspPreSetSettings[dspPreSetKey][i];
        const dsp = globalStorage.dspPartners[key];

        let adaptKeyDsp = `${adaptkey}|${dsp.id}`;

        let margin = Math.ceil((101 / (100 - (sspPartner['marga'] + dsp.marga)) - 1) * 100);
        let bf = bidfloor;
        if (margin > 0) bf = Math.ceil((bidfloor + (bidfloor * (margin / 100))) * 1000) / 1000;

        let reason = Filters({
            type,
            rewarded,
            syncedDspKeys,
            percentPixalateFraud,
            size
        }, request, key, sspPartner, device, adaptKeyDsp, siteApp.publisher.id, bf, userId, siteApp.cat, siteAppName, source, platformType);

        if (reason) {
            if (reason === 'passer limit violated') addCountCoreMaxQpsDSP(key);
            asyncCallback();
            continue;
        }

        if (globalStorage.dspPartners[key]['usevast'] === 1) {
            vastDSP.push(key);
            asyncCallback();
            continue;
        }

        let dspBidRequest = JSON.parse(JSON.stringify(mainBidRequest)); //clone(mainBidRequest);

        if (dsp.company == 'mediagrid' && dspBidRequest.device && dspBidRequest.device.language && dspBidRequest.device.language.length > 2) {
            return
        }

        if (dsp.company == 'mediagrid' && dspBidRequest.content && dspBidRequest.content.language && dspBidRequest.content.language.length > 2) {
            return
        }
        updateSourceObject(dspBidRequest, dsp); 

        //user-sync
        if (syncedDspKeys[key]) {
            dspBidRequest['user']['buyeruid'] = syncedDspKeys[key]['id']
        } else {
            dspBidRequest['user']['id'] = userId;
        }

        dspBidRequest['imp'][0]['bidfloor'] = bf;
        if (dsp.tcf2) dspBidRequest = tcf2Module.applyTCF2(dspBidRequest);
        if (dsp.coppa && dspBidRequest['regs'] && dspBidRequest['regs']['coppa'] == 1) dspBidRequest = tcf2Module.anonymizeData(dspBidRequest);
        if (dsp.ccpa && !Functions.CCPA_check(dspBidRequest)) dspBidRequest = tcf2Module.anonymizeData(dspBidRequest);

        let headers = {
            'Content-Type': 'application/json',
            'x-openrtb-version': '2.5',
            'host': `${(dsp.badhost ? dsp.badhost : dsp.host)}`,
        };

        if((dsp.id == 1680 || dsp.id == 1679 || dsp.id == 1682 || dsp.id == 1683 || dsp.id == 1684 || dsp.id == 1685 || dsp.id == 1686 || dsp.id == 1687 || dsp.id == 1688) && dspBidRequest.device && dspBidRequest.device.os === 'mac os'){
            return
        }
        dspBidRequest = DSPConnectors.modifyFinalRequest(key, sspPartner, placementParams, dspBidRequest, platformType, request, source, type, isCTV, size, headers, requestsByNativeSpec);

        addCountCoreRealQpsDSP(key);
        dspInfoService.addEvent(dsp.id, 'requests');

        if (dsp.prebidPayload) {
            dspBidRequest = DSPConnectors.modifyPrebidRequest(dspBidRequest, dsp, type, size, isCTV);
            if (!dspBidRequest) {
                asyncCallback();
                continue;
            }
        }

        if(dspBidRequest.source && dspBidRequest.source.ext && (dspBidRequest.source.ext.omidpn || dspBidRequest.source.ext.omidpv) ) {
//            console.log('remove omidpn ' , dspBidRequest.source.ext.omidpn)
//            console.log('remove omidpv ' , dspBidRequest.source.ext.omidpv)
            delete dspBidRequest.source.ext.omidpn
            delete dspBidRequest.source.ext.omidpv

           // console.log(dspBidRequest)
        }

        if(dspBidRequest.imp && dspBidRequest.imp[0] && (dspBidRequest.imp[0].displaymanager || dspBidRequest.imp[0].displaymanagerver)) {
            delete dspBidRequest.imp[0].displaymanager
            delete dspBidRequest.imp[0].displaymanagerver
        }

        if(dspBidRequest.imp && dspBidRequest.imp[0] && dsp.company == "epsilon" ) {
            dspBidRequest.imp[0].displaymanager = "prebid-s2s"
            dspBidRequest.imp[0].displaymanagerver = "2.0.0"
            delete dspBidRequest.source.fd
            delete dspBidRequest.source.pchain
            delete dspBidRequest.source.tid
        }

        if (dsp.id == 1541 || dsp.id == 1538 || dsp.id == 1542 || dsp.id == 1540 || dsp.id == 1543 || dsp.id == 1539 || dsp.id == 20005 || dsp.id == 20004 || dsp.id == 30016 || dsp.id == 30018 || dsp.id == 30019 || dsp.id == 30017 || dsp.id == 20024 || dsp.id == 20015 || dsp.id == 20016 || dsp.id == 20026 || dsp.id == 20025 || dsp.id == 1693 || dsp.id == 1689 || dsp.id == 1690 || dsp.id == 1691 || dsp.id == 1678 || dsp.id == 1692){
            if (dspBidRequest &&
                dspBidRequest.source &&
                dspBidRequest.source.ext){
                delete dspBidRequest.source.ext.schain;
            }
        }

        if (dspBidRequest &&
            dspBidRequest.source &&
            dspBidRequest.source.ext &&
            dspBidRequest.source.ext.schain &&
            dspBidRequest.source.ext.schain.nodes) {

            let nodes = dspBidRequest.source.ext.schain.nodes;
            let lastNode = nodes[nodes.length - 1];

            if (lastNode && lastNode.asi === Config.schain_domain) {
                PrometheusService.getInstance().inc('ad_ex_our_schain', {
                    dsp_id: dsp.id,
                    dsp_schain: dsp.schain
                })
            } else {
                PrometheusService.getInstance().inc('ad_ex_no_our_schain', {
                    dsp_id: dsp.id,
                    dsp_schain: dsp.schain
                });
            }
        } else {
            PrometheusService.getInstance().inc('ad_ex_no_schain', {
                dsp_id: dsp.id,
                dsp_schain: dsp.schain
            });
        }
        if((dsp.id == 1516 || dsp.id == 1519) && dspBidRequest &&
            dspBidRequest.source &&
            dspBidRequest.source.ext &&
            dspBidRequest.source.ext.schain &&
            dspBidRequest.source.ext.schain.complete){
        }

        if( dsp.id == 1545 &&
            (
                (dspBidRequest.badv && dspBidRequest.badv.length > 10) ||
                (dspBidRequest.bcat && dspBidRequest.bcat.length > 10) ||
                (dspBidRequest.bapp && dspBidRequest.bapp.length > 10)
            )
        ) {
            if(dspBidRequest.badv) dspBidRequest.badv = dspBidRequest.badv.slice(0, 10)
            if(dspBidRequest.bcat) dspBidRequest.bcat = dspBidRequest.bcat.slice(0, 10)
            if(dspBidRequest.bapp) dspBidRequest.bapp = dspBidRequest.bapp.slice(0, 10)
        }

        postDataString = JSON.stringify(dspBidRequest);

            if (ServerConfig.analytics.ourBidRequests) {
                insertOurBidRequestIntoMongo(dspBidRequest, sspPartner, type, device['devicetype'], dsp.id, request, ServerConfig.serverip, sspTmax)
            }

        //insertOurBidRequestIntoMongo(dspBidRequest, sspPartner, type, device['devicetype'], dsp.id, request)

        dsp.passer++;
        headers['Content-Length'] = Buffer.byteLength(postDataString, 'utf8')

        reqResStorage.save('ownBidRequest', dsp.id, postDataString);

        const sspStatUnit = new SSPStatsUnitModel(source, sspPartner.id, dsp.id, originalPubId, type,
            request['imp'][0][type]['w'] || 0, request['imp'][0][type]['h'] || 0, device['geo']['country'], subType,
            isApp, device['devicetype'], 'crid', Config.sspInfoKeys.REQUEST_SENT_TO_DSP);

        // Vova_cleanup
        // sspRequestStatsService.incrementSSPInfoStatus(
        //     sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.REQUEST_SENT_TO_DSP
        // );

        sspStatUnit.setStatus(Config.sspInfoKeys.ORIGINAL_BID_FLOOR);
        // Vova_cleanup
        // sspRequestStatsService.incrementSSPInfoStatusWithValue(
        //     sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.ORIGINAL_BID_FLOOR, bidfloor
        // );

        sspStatUnit.setStatus(Config.sspInfoKeys.BID_FLOOR);

        // Vova_cleanup
        // sspRequestStatsService.incrementSSPInfoStatusWithValue(
        //     sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.BID_FLOOR, bf
        // );

        sendDSPArr.add(key);

        const requestModule = dsp.port === 443 ? https : http;
        const agent = dsp.port === 443 ? globalServices.keepaliveHttpsAgent : globalServices.keepaliveAgent;

        //TRAFFIC REVERSE (TR)
        // if(dsp.id == 1505 || dsp.id == 1516){
        //     if(dsp.id == 1505 || dsp.id == 1516){}
        //     console.log(`dsp id: ${dsp.id} || dsp request: ${postDataString}`);
        //     asyncCallback();
        //     continue;
        // }

        //dsp request log
        // if(dsp.id == 1501){
        //     console.log(`dsp id: ${dsp.id} || dsp request: ${postDataString}`);
        // }
        // asyncCallback();
        // continue;

        let postRequest = requestModule.request({
            agent: agent,
            host: dsp.host ? dsp.host : dsp.badhost,
            port: dsp.port,
            path: dsp.path,
            method: 'POST',
            headers: headers,
        }, (resp) => {
            if (alreadyansw === true) return;
            // sendDSPArr.delete(key);

            if (resp.statusCode !== 200) {
                resp.on('data', (chunk) => {});
                resp.on('end', () => {});
                dspInfoService.addReason(dsp.id, 'no_bid', {statusCode: resp.statusCode})
                return asyncCallback();
            }

            /**
             * @param  {number} dspId
             * @param  {string} reason
             * @param  {object} data
             */
            const dspInfoCallback = (reason, data) => {
                data.sspId = sspPartner.id;
                // dspInfoService.addReason(dsp.id, reason, data);
                return asyncCallback();
            };

            streamToString(resp, (err, data) => {
                if (err) {
                    console.error(`Error while parsing gzip encoded response from DSP. DSP name - ${key}, ${err}`);
                    return asyncCallback();
                }

                if (dsp.prebidPayload && (data.indexOf('errors') !== -1 || data.indexOf('adm') === -1)) {
                    return dspInfoCallback('no_bid', {statusCode: 204});
                }



                if (data === '' || data.indexOf('adm') === -1) return dspInfoCallback('no_price_or_adm', {
                    requestJSON: postDataString,
                    responseJSON: data
                });

                if (ServerConfig.analytics.bidResponses) {
                    let dataJson;
                    try {
                        dataJson = JSON.parse(data);
                    } catch (error) {
                        console.error('Error while parsing data JSON:', error);
                        return;
                    }
                    insertBidResponseIntoMongo(dataJson, dsp.id, dspBidRequest, sspPartner, type, device['devicetype'], request, ServerConfig.serverip, sspTmax);
                }

                dspBidRequest = null;

                dspInfoService.addEvent(dsp.id, 'responses');
                addCountCoreBidQpsDSP(key);
                PrometheusService.getInstance().inc('ad_ex_dsp_response', { dsp_id: dsp.id});
                const marga = sspPartner.marga + dsp.marga;
                let resp = parseResponse(`{"dsp":"${key}", "bf":${bf}, "margin":${marga}, "data":${data}}`, reqResStorage);

                if (sspPartner['company'] == "ironsource" && resp.data.seatbid && resp.data.seatbid[0] && resp.data.seatbid[0].bid && resp.data.seatbid[0].bid[0] && (!resp.data.seatbid[0].bid[0].adomain || resp.data.seatbid[0].bid[0].adomain.length === 0)){
                        return
                }

                if(resp.data.seatbid && resp.data.seatbid[0] && resp.data.seatbid[0].bid && resp.data.seatbid[0].bid[0] && resp.data.seatbid[0].bid[0].cat && Array.isArray(resp.data.seatbid[0].bid[0].cat)
                     && request.bcat && Array.isArray(request.bcat)){
                    let responseCat = resp.data.seatbid[0].bid[0].cat;
                    let found = responseCat.some(cat => request.bcat.includes(cat));
                    if (found) {
                        return
                    }
                }

                if(resp.data.seatbid && resp.data.seatbid[0] && resp.data.seatbid[0].bid && resp.data.seatbid[0].bid[0] && resp.data.seatbid[0].bid[0].attr && Array.isArray(resp.data.seatbid[0].bid[0].attr) && request.imp && request.imp[0]){
                    let responseAttr = resp.data.seatbid[0].bid[0].attr;

                    if(type === 'banner' && request.imp[0].banner && request.imp[0].banner.battr){
                        let found = responseAttr.some(attr => request.imp[0].banner.battr.includes(attr));
                        if (found) {
                            return
                        }
                    } else if(type === 'video' && request.imp[0].video && request.imp[0].video.battr){
                        let found = responseAttr.some(attr => request.imp[0].video.battr.includes(attr));
                        if (found) {
                            return
                        }
                    }
                }

                if (resp === false || !resp['data']['seatbid'][0]['bid'][0]['adm']) return dspInfoCallback('parse_bid_error', {
                    requestJSON: postDataString,
                    responseJSON: data
                });

                sspStatUnit.setDSPid(dsp.id);
                sspStatUnit.setCrid(resp['data']['seatbid'][0]['bid'][0]['crid']);
                sspStatUnit.setStatus(Config.sspInfoKeys.BID_FROM_DSP);
                // Vova_cleanup
                // sspRequestStatsService.incrementSSPInfoStatus(
                //     sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.BID_FROM_DSP
                // );

                sspStatUnit.setStatus(Config.sspInfoKeys.PRICE);

                // Vova_cleanup
                // sspRequestStatsService.incrementSSPInfoStatusWithValue(
                //     sspStatUnit.getRequestDimensionsArray(), Config.sspInfoKeys.PRICE, parseFloat(resp['data']['seatbid'][0]['bid'][0]['price'])
                // );

                //set adaptive key
                let aerospikeAdaptKey = new Aerospike.Key(Config.adapterSettings.namespace, `${Config.adapterSettings.set}${ServerConfig.region}`, adaptKeyDsp);
                globalServices.AerospikeClient.put(aerospikeAdaptKey, {'key': adaptKeyDsp}, Config.aerospike.meta, Config.aerospike.policies, err_);
                adapterdsp[adaptKeyDsp] = true;

                DSPConnectors.modifyResponseEachDSP(dsp.company, resp, type);

                resp['data']['seatbid'][0]['bid'][0]['price'] = parseFloat(resp['data']['seatbid'][0]['bid'][0]['price']);

                if (isNaN(resp['data']['seatbid'][0]['bid'][0]['price']) || (bf > resp['data']['seatbid'][0]['bid'][0]['price']) || (resp['data']['seatbid'][0]['bid'][0]['price'] > 50)) {
                    return dspInfoCallback('bad_price', {requestJSON: postDataString, responseJSON: data});
                }

                let ourcrid = crypto.createHash('md5').update(`${dsp.company}_${resp['data']['seatbid'][0]['bid'][0]['crid']}`).digest('hex');
                resp['newcrid'] = ourcrid;

                if (!SSPConnectors.checkSSPEndpointRequirements(resp, sspPartner, type)) return dspInfoCallback('ssp_connector_mismatch', {
                    requestJSON: postDataString,
                    responseJSON: data
                });

                switch (type) {
                    case 'native':
                        const {
                            data: adm,
                            error
                        } = nativeModule.getDSPResponseAdm(request['imp'][0]['native'], resp['data']['seatbid'][0]['bid'][0]['adm']);
                        if (error) return dspInfoCallback(error, {
                            requestJSON: postDataString,
                            responseJSON: data
                        });

                        resp['data']['seatbid'][0]['bid'][0]['adm'] = adm;
                        break;
                    case 'banner':
                        if (sspPartner['blockbytmt'] == 1 && Config.useTmt[region] && globalStorage.dspPartners[resp['dsp']]['donocheckmalware'] != 1) {
                            //cachedTags
                            if (resp['data']['seatbid'][0]['bid'][0]['crid']) {
                                if (!updateCridData[dsp.company]) {
                                    updateCridData[dsp.company] = {};
                                }
                                if (!updateCridData[dsp.company][ourcrid] && !savedTags[ourcrid]) {
                                    updateCridData[dsp.company][ourcrid] = [parseInt(Date.now() / 1000), sspPartner['blockbytmt'], sspPartner['blockbygeoedge'], resp['data']['seatbid'][0]['bid'][0]['crid'], resp['data']['seatbid'][0]['bid'][0]['adm'], 0];
                                }
                                if (!updateCridData[dsp.company][ourcrid]) {
                                    updateCridData[dsp.company][ourcrid] = [parseInt(Date.now() / 1000), sspPartner['blockbytmt'], sspPartner['blockbygeoedge'], resp['data']['seatbid'][0]['bid'][0]['crid'], '', 0];
                                }
                                if (updateCridData[dsp.company][ourcrid][1] === 0 && sspPartner['blockbytmt'] == 1) {
                                    updateCridData[dsp.company][ourcrid][1] = 1;
                                }
                                if (updateCridData[dsp.company][ourcrid][2] === 0 && sspPartner['blockbygeoedge'] == 1) {
                                    updateCridData[dsp.company][ourcrid][2] = 1;
                                }
                                updateCridData[dsp.company][ourcrid][5]++;
                            }

                            if (!resp['data']['seatbid'][0]['bid'][0]['crid'] || resp['data']['seatbid'][0]['bid'][0]['crid'] == '0' || resp['data']['seatbid'][0]['bid'][0]['crid'] == ' ') {
                                return dspInfoCallback('tmt_empty_crid', {
                                    requestJSON: postDataString,
                                    responseJSON: data
                                });
                            }

                            if (blockedCreativesTMT['empty'] == '1' || (blockedCreativesTMT[ourcrid] === true)) {
                                return dspInfoCallback('tmt_blocked_crid', {
                                    requestJSON: postDataString,
                                    responseJSON: data,
                                    tmtBlockedCrid: resp['data']['seatbid'][0]['bid'][0]['crid']
                                });
                            }

                            if (blockedDomainsTMT) {
                                const cacheKey = `${resp['data']['seatbid'][0]['bid'][0]['crid']}${resp['dsp']}`;

                                if (!cacheTMTDomains[cacheKey]) {
                                    const scanResult = Functions.checkForTmtDomains(resp['data']['seatbid'][0]['bid'][0]['adm'], blockedDomainsTMT, resp['data']['seatbid'][0]['bid'][0]['crid']);
                                    const ttl = Date.now() / 1000 + (parseInt(Math.random() * 4) + 8) * 60;

                                    if (scanResult !== false && scanResult !== source) {
                                        cacheTMTDomains[cacheKey] = ['bad', ttl, scanResult];
                                        return dspInfoCallback('tmt_blocked_adm_domains', {
                                            requestJSON: postDataString,
                                            responseJSON: data,
                                            tmtBlockedAdmDomains: scanResult
                                        });
                                    } else {
                                        cacheTMTDomains[cacheKey] = ['good', ttl];
                                    }
                                } else if (cacheTMTDomains[cacheKey][0] === 'bad') {
                                    return dspInfoCallback('tmt_blocked_adm_domains', {
                                        requestJSON: postDataString,
                                        responseJSON: data,
                                        tmtBlockedAdmDomains: cacheTMTDomains[cacheKey][2]
                                    });
                                }
                            } else return dspInfoCallback('no_blocked_tmt_domains', {
                                requestJSON: postDataString,
                                responseJSON: data
                            });

                            if ((!checkedCreativesTMT[ourcrid] || checkedCreativesTMT[ourcrid] == 0) && (!allowedCreativesTMT[ourcrid] || allowedCreativesTMT[ourcrid] == 0)) {
                                return dspInfoCallback('tmt_no_checked_crid', {
                                    requestJSON: postDataString,
                                    responseJSON: data
                                });
                            }
                        }
                        break;
                    case 'video':
                    case 'audio':
                        break;
                    default:
                        break;
                }

                if (resp['data']['cur'] && resp['data']['cur'] !== 'USD') return dspInfoCallback('bad_currency', {
                    requestJSON: postDataString,
                    responseJSON: data
                });

                //block domain in adm for SSP
                if (sspPartner['blockDomains']) {
                    let adm = (typeof resp['data']['seatbid'][0]['bid'][0]['adm'] === 'object') ? data : resp['data']['seatbid'][0]['bid'][0]['adm'];
                    let matches = (adm).match(sspPartner['blockDomains']);
                    if (matches) {
                        return dspInfoCallback('ssp_blocked_adm_domain', {
                            requestJSON: postDataString,
                            responseJSON: data,
                            domain: matches[0].toLowerCase()
                        });
                    }
                }

                if (blockedCrids[sspPartner['id']] &&
                    (
                        blockedCrids[sspPartner['id']][resp['data']['seatbid'][0]['bid'][0]['crid']] === true ||
                        blockedCrids[sspPartner['id']][`${ourcrid}${Config.criddelimeter}${dsp.id}`] === true
                    )
                ) {
                    return dspInfoCallback('ssp_blocked_crid', {
                        requestJSON: postDataString,
                        responseJSON: data,
                        crid: resp['data']['seatbid'][0]['bid'][0]['crid']
                    });
                }

                //////////////////////////////////////// TEST AUCTION //////////////////////////////////

                resp['data']['seatbid'][0]['bid'][0]['adomain'] = Functions.getAdomain(resp['data']['seatbid'][0]['bid'][0]['adomain'], sspPartner);

                if (request['badv'] && Array.isArray(request['badv']) && request['badv'].length > 0 && request['badv'][0] != '' && resp['data']['seatbid'][0]['bid'][0]['adomain'] && request['badv'].indexOf(resp['data']['seatbid'][0]['bid'][0]['adomain'][0]) !== -1) {
                    return dspInfoCallback('blocked_adv_domain', {
                        requestJSON: postDataString,
                        responseJSON: data
                    });
                }

                dspInfoService.addEvent(dsp.id, 'validResponses');

                let rate = 0.5;
                if (globalStorage.sspDspRate[`${sspPartner['name']}|${key}`] !== undefined) rate = globalStorage.sspDspRate[`${sspPartner['name']}|${key}`];
                resp['data']['seatbid'][0]['bid'][0]['rate'] = rate;

                if ((resp['data']['seatbid'][0]['bid'][0]['price'] - (resp['data']['seatbid'][0]['bid'][0]['price'] * (resp['margin'] / 100))) < minbidexitprice) {
                    if (!passbackBid['dsp']) {
                        passbackBid = resp;
                    } else if (rate > 0.5) {
                        passbackBid = resp;
                    } else if (rate > passbackBid['data']['seatbid'][0]['bid'][0]['rate'] && ((resp['data']['seatbid'][0]['bid'][0]['price'] - passbackBid['data']['seatbid'][0]['bid'][0]['price']) / passbackBid['data']['seatbid'][0]['bid'][0]['price']) > 0) {
                        passbackBid = resp;
                    } else if (resp['data']['seatbid'][0]['bid'][0]['price'] > passbackBid['data']['seatbid'][0]['bid'][0]['price']) {
                        let perc = (resp['data']['seatbid'][0]['bid'][0]['price'] - passbackBid['data']['seatbid'][0]['bid'][0]['price']) / passbackBid['data']['seatbid'][0]['bid'][0]['price'];
                        passbackBid = resp;
                    } else {
                        let perc = (passbackBid['data']['seatbid'][0]['bid'][0]['price'] - resp['data']['seatbid'][0]['bid'][0]['price']) / resp['data']['seatbid'][0]['bid'][0]['price'];
                        if (perc < 0.2 && rate > 0.5 && passbackBid['data']['seatbid'][0]['bid'][0]['rate'] < 0.5 && rate * resp['data']['seatbid'][0]['bid'][0]['price'] > passbackBid['data']['seatbid'][0]['bid'][0]['rate'] * passbackBid['data']['seatbid'][0]['bid'][0]['price']) {
                            passbackBid = resp;
                        }
                    }
                    return asyncCallback();
                } else {
                    passbackBid = resp;
                    return asyncCallback(true);
                }
            })
        }).on('error', (err) => {
            if (alreadyansw === true) return;
            // globalStorage.dspPartners[key]['limit']++;
            // dspInfoService.addEvent(dsp.id, 'errors');

            sendDSPArr.delete(dsp.id);
            PrometheusService.getInstance().inc('ad_ex_dsp_request_error', { dsp_id: dsp.id})

            return asyncCallback();
        });

        postRequest.setTimeout(parseInt(request['tmax']), () => {

            PrometheusService.getInstance().inc('ad_ex_tmax', { dsp_id: dsp.id})
            postRequest.destroy();
            if (alreadyansw === true) return;

            return asyncCallback();

        });

        postRequest.setNoDelay(true);

        //NEED add gzipRequests setting to dsp obj
        PrometheusService.getInstance().inc('ad_ex_dsp_request', { dsp_id: dsp.id});
        if (dsp.gzipRequests === 1) {
            makeResponseGzipEncoding(postDataString, (err, gzip_data) => {
                if (err) console.error('gzip request error', err);
                postRequest.setHeader('Content-Length', Buffer.byteLength(gzip_data));
                postRequest.setHeader('Accept-Encoding', 'gzip');
                postRequest.setHeader('Content-Encoding', 'gzip');
                postRequest.write(gzip_data);
                postRequest.end();
            });
        } else {
            postRequest.write(postDataString);
            postRequest.end();
        }
        globalStorage.dspPartners[key]['sendreq']++;
    }
};

const creativesR = [
    'https://assets.krushmedia.com/4-448cd303971cadc81be8b2821bb84107.mp4',
    'https://assets.krushmedia.com/4-448cd303971cadc81be8b2821bb84107.mp4',
    'https://assets.krushmedia.com/4-448cd303971cadc81be8b2821bb84107.mp4'
];

function getRandCreative(request) {

    const hash = crypto.createHash('md5').update(`${Math.random()}${request['id']}`).digest('hex');
    const rand = Math.floor(Math.random() * 3);
    const impTracker = `${serverssl}?${Config.typeParameter}=${Config.impression}&${Config.secondPriceParameter}=\${AUCTION_PRICE}&${Config.dspParameter}=1000000${Config.criddelimeter}${rand}&${Config.trafficTypeParameter}=${Config['video']}&${Config.hashParameter}=${hash}`;
    // const adm = `<VAST version="3.0"><Ad id="${hash}"><InLine><AdSystem version="2.0"></AdSystem><AdTitle><![CDATA[${hash}]]></AdTitle><Impression id="${hash}"><![CDATA[${impTracker}]]></Impression><Creatives><Creative><Linear><Duration>00:00:30</Duration><MediaFiles><MediaFile id="${hash}" delivery="progressive" type="video/mp4" width="1024" height="768"><![CDATA[https://gcdn.2mdn.net/videoplayback/id/464ea63589771cea/itag/37/source/web_video_ads/ctier/L/acao/yes/ip/0.0.0.0/ipbits/0/expire/3843225477/sparams/id,itag,source,ctier,acao,ip,ipbits,expire/signature/97546F43FFBD9B85567A12D6FBD6C0B0F7933D0E.D89620BC3F50BA51B09FC4DEF4155EACCC69E4/key/ck2/file/file.mp4]]></MediaFile></MediaFiles></Linear><CreativeExtensions></CreativeExtensions></Creative></Creatives><Description></Description><Survey></Survey><Extensions></Extensions></InLine></Ad></VAST>`;
    const adm = `<img src="https://fastly.picsum.photos/id/1/320/50.jpg?hmac=wsqAt7_SCH0bGWE6ChtDj21EMfdq5uH6bS8-JQLitl0" width="320" height="50" />`;

    let scriptObj = {
        'pid': request.app.id,
        'originalPid': request.app.id,
        'domain': '',
        'sid': '1',
        'reqid': request.id,
        'realsid': '1',
        'dsp': 'test_dsp',
        'ssp': 'metax_graytv_US_EAST',
        'id': request['id'],
        'trafftype': 'type',
        'subType': '',
        'price': 20,
        'nurl': '',
        'sspId': 1498,
        'dspId': 0,
        'isApp': 1,
        'country': '',
        'region': '',
        'city': '',
        'devicetype': 3,
        'dspSpend': 20,
        'w': 1920,
        'h': 1080,
        'nurlimpression': 0,
        'bundle': request.app.bundle,
        'type': 'video',
        'crid': '',
        'repackCrid': ''
    };


    redisClient.set(`script_${hash}`, JSON.stringify(scriptObj), {'EX': 1200})


    return JSON.stringify({
        id: request.id,
        bidid: request.id,
        seatbid: [
            {
                bid: [
                    {
                        id: hash,
                        impid: "1",
                        price: 1.2,
                        nurl: `https://sn-us1.aceex.io/?ttpw=nurl&fpp=\${AUCTION_PRICE}&traf=vid&hh=${hash}`,
                        w: 320,
                        h: 50,
                        adm: adm,
                        adid: "676666f8e580",
                        cat: [
                            "IAB3"
                        ],
                        cid: "topgg",
                        crid: `podsp|${rand}`
                    }
                ],
                seat: "100000"
            }
        ],
        cur: "USD"
    })
}

function prepareBidResponse(response, sspPartner, request, oldp, bidfloor, trafftype, domain, siteId, pubId, impid_, reqid, percprice, source, type, device, subType, originalPubId, ext, postDataString, sspTmax) {

    const hash = crypto.createHash('md5').update(`${Math.random()}${request['id']}${sspPartner['name']}`).digest('hex');
    const dsp = globalStorage.dspPartners[response['dsp']];

    if (stiristaDsp.includes(response['dsp'])) {
        if (response['data'] && response['data']['seatbid'] && response['data']['seatbid'][0]
            && response['data']['seatbid'][0]['bid'] && response['data']['seatbid'][0]['bid'][0]
            && response['data']['seatbid'][0]['bid'][0]['dealid']) {
            delete response['data']['seatbid'][0]['bid'][0]['dealid'];
        }
    }

    ['nurl', 'burl'].forEach((edp) => {
        if (response['data']['seatbid'][0]['bid'][0][edp]) response['data']['seatbid'][0]['bid'][0][edp] = response['data']['seatbid'][0]['bid'][0][edp].replace(/\$\{AUCTION_CURRENCY\}/g, 'USD').replace(/\$\{AUCTION_AD_ID\}/g, (response['data']['seatbid'][0]['bid'][0]['adid'] ? response['data']['seatbid'][0]['bid'][0]['adid'] : '')).replace(/\$\{AUCTION_SEAT_ID\}/g, (response['data']['seat'] ? response['data']['seat'] : globalStorage.dspPartners[response['dsp']]['id'].toString())).replace(/\$\{AUCTION_IMP_ID\}/g, impid_).replace(/\$\{AUCTION_BID_ID\}/g, (response['data']['bidid'] ? response['data']['bidid'] : ''))
    });

    let ourpr = parseFloat((response['bf'] + (oldp - response['bf']) * Functions.getRandomFloat(0.93, 0.98)).toFixed(5));
    if (ourpr < response['bf']) ourpr = response['bf'];

    if (dsp.at == 1 || dsp.useVast === 1) ourpr = oldp;

    let winbid_marcos = '${AUCTION_PRICE}';
    let lossbid_macros = '${AUCTION_LOSS}';
    let adid = response['data']['seatbid'][0]['bid'][0]['crid']
    && response['data']['seatbid'][0]['bid'][0]['crid'] != '0' ?
        crypto.createHash('md5').update(`${response['dsp']}${response['data']['seatbid'][0]['bid'][0]['crid']}`).digest('hex').substr(20)
        : '';

    let admcode = '';
    let url = '';
    let newurl = '';
    let impPixel = `${serverssl}?${Config.typeParameter}=${Config.impression}&${Config.secondPriceParameter}=${winbid_marcos}&${Config.dspParameter}=${globalStorage.dspPartners[response['dsp']]['id']}${Config.criddelimeter}${response['newcrid']}&${Config.trafficTypeParameter}=${Config[type]}&${Config.hashParameter}=${hash}`;
    let nurl = `${serverssl}?${Config.typeParameter}=${Config.nurl}&${Config.secondPriceParameter}=\${AUCTION_PRICE}&${Config.fakePriceParameter}=${winbid_marcos}&${Config.trafficTypeParameter}=${Config[type]}&${Config.hashParameter}=${hash}`;
    let lurl = `${serverssl}?${Config.typeParameter}=${Config.lurl}&${Config.fakePriceParameter}=${winbid_marcos}&${Config.lossReasonParameter}=${lossbid_macros}&${Config.trafficTypeParameter}=${Config[type]}&${Config.hashParameter}=${hash}`;
    let burl = `${serverssl}?${Config.typeParameter}=${Config.burl}&${Config.fakePriceParameter}=${winbid_marcos}&${Config.trafficTypeParameter}=${Config[type]}&${Config.hashParameter}=${hash}`;
    let clickPixel = `${serverssl}click?${Config.typeParameter}=${Config.click}&${Config.sspParameter}=${sspPartner['id']}&${Config.dspParameter}=${dsp.id}${Config.criddelimeter}${response['newcrid']}&${Config.trafficTypeParameter}=${Config[type]}&${Config.hashParameter}=${hash}`;
    let memTtl = sspPartner.expiryTime;

    let objResponse = {
        'id': request['id'].toString(),
        'bidid': crypto.createHash('md5').update(`${hash}1`).digest('hex'),
        'seatbid': [{
            'bid': [{
                'id': crypto.createHash('md5').update(`${hash}2`).digest('hex'),
                'impid': request['imp'][0]['id'].toString(),
                'price': parseFloat(response['data']['seatbid'][0]['bid'][0]['price']),
                'nurl': nurl,
                'lurl': lurl,
                'burl': burl,
                'w': request['imp'][0][type]['w'],
                'h': request['imp'][0][type]['h'],
                'adomain': response['data']['seatbid'][0]['bid'][0]['adomain']
            }],
            'seat': dsp.id.toString()
        }],
        'cur': 'USD'
    };

    //pixalate
    let pixalate = Config.pixalate.usePixalate[region] ? addPixalateMacros(request, response, {
        pubId,
        siteId,
        source,
        trafftype
    }, type, sspPartner['company'], device['geo']['country']) : '';

    response['data']['seatbid'][0]['bid'][0]['adm'] = response['data']['seatbid'][0]['bid'][0]['adm'].replace(/\$\{AUCTION_ID\}/g, reqid).replace(/\$\{AUCTION_PRICE\}/g, ourpr.toString()).replace(/%24%7BAUCTION_PRICE%7D/g, ourpr.toString()).replace(/\$\{AUCTION_CURRENCY\}/g, 'USD').replace(/\$\{AUCTION_AD_ID\}/g, (response['data']['seatbid'][0]['bid'][0]['adid'] ? response['data']['seatbid'][0]['bid'][0]['adid'] : '')).replace(/\$\{AUCTION_SEAT_ID\}/g, (response['data']['seat'] ? response['data']['seat'] : globalStorage.dspPartners[response['dsp']]['id'].toString())).replace(/\$\{AUCTION_IMP_ID\}/g, impid_).replace(/\$\{AUCTION_BID_ID\}/g, (response['data']['bidid'] ? response['data']['bidid'] : ''));

    switch (type) {
        case 'banner':
            if (response['data']['seatbid'][0]['bid'][0]['iurl']) response['data']['seatbid'][0]['bid'][0]['iurl'] = '';

            let syncCode = '';
            if (request['app'] === undefined && request['device']['dnt'] != 1) syncCode = globalServices.userSync.getSyncScriptMarkup(response);
            if (sspPartner['prepixel'] == 1) {
                admcode = `<img src='${impPixel}' border='0' width='1' height='1'>${response['data']['seatbid'][0]['bid'][0]['adm']}${syncCode}${pixalate}`;
            } else {
                admcode = `${response['data']['seatbid'][0]['bid'][0]['adm']}<img src='${impPixel}' border='0' width='1' height='1'>${syncCode}${pixalate}`;
            }
            admcode = Functions.prepareClickAdmCode(admcode, hash, clickPixel);

            break;
        case 'native':
            admcode = nativeModule.getBidResponseAdm(
                request['imp'][0]['native'],
                response['data']['seatbid'][0]['bid'][0]['adm'],
                [impPixel, pixalate],
            );

            if (!admcode) return false;
            break;
        case 'video':
        case 'audio':
            let tmpchunk = '';
            newurl = `<Tracking event='start'><![CDATA[${impPixel}]]></Tracking>`;
            url = `<Impression><![CDATA[${impPixel}]]></Impression>`;
            url += `${pixalate}`;
            admcode = response['data']['seatbid'][0]['bid'][0]['adm'];

            admcode = admcode.replace(/\$\{DNT\}/g, request['device']['dnt'] || 0)
                .replace(/\[DO_NOT_TRACK\]/g, request['device']['dnt'] || 0)
                .replace(/\[ADX_CB_PUB\]/g, crypto.createHash('md5').update(request['id']).digest('hex'))
                .replace(/\[ADX_ADS_PAGE\]/g, encodeURIComponent(source))
                .replace(/\[ADX_SITE_ID\]/g, siteId);

            if (admcode.indexOf('<TrackingEvents>') !== -1 && globalStorage.dspPartners[response['dsp']]['videoStartTracker']) {
                tmpchunk = admcode.split('<TrackingEvents>');
                admcode = `${tmpchunk[0]}<TrackingEvents>${newurl}`;
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += (i == 1 ? tmpchunk[i] : `<TrackingEvents>${tmpchunk[i]}`);
                }
            } else if (admcode.indexOf('<Linear>') !== -1 && globalStorage.dspPartners[response['dsp']]['videoStartTracker']) {
                tmpchunk = admcode.split('<Linear>');
                admcode = `${tmpchunk[0]}<Linear><TrackingEvents>${newurl}</TrackingEvents>`;
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += (i === 1 ? '' : '<Linear>') + tmpchunk[i];
                }
            } else if (admcode.indexOf('<Impression>') !== -1) {
                tmpchunk = admcode.split('<Impression>');
                admcode = `${tmpchunk[0]}${url}`;
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += `<Impression>${tmpchunk[i]}`;
                }
            } else if (admcode.indexOf('</VASTAdTagURI>') !== -1) {
                tmpchunk = admcode.split('</VASTAdTagURI>');
                admcode = tmpchunk[0];
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += `</VASTAdTagURI>${(i == 1 ? url : '')}${tmpchunk[i]}`;
                }
            } else if (admcode.indexOf('%3C%2FVASTAdTagURI%3E') !== -1) {
                tmpchunk = admcode.split('%3C%2FVASTAdTagURI%3E');
                admcode = tmpchunk[0];
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += `%3C%2FVASTAdTagURI%3E${(i === 1 ? encodeURIComponent(url) : '')}${tmpchunk[i]}`;
                }
            } else if (admcode.indexOf('<TrackingEvents>') !== -1) {
                tmpchunk = admcode.split('<TrackingEvents>');
                admcode = `${tmpchunk[0]}<TrackingEvents>${newurl}`;
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += (i === 1 ? tmpchunk[i] : `<TrackingEvents>${tmpchunk[i]}`);
                }
            } else if (admcode.indexOf('<Linear>') !== -1) {
                tmpchunk = admcode.split('<Linear>');
                admcode = `${tmpchunk[0]}<Linear><TrackingEvents>${newurl}</TrackingEvents>`;
                for (let i = 1; i < tmpchunk.length; i++) {
                    admcode += (i === 1 ? '' : '<Linear>') + tmpchunk[i];
                }
            } else {
                console.error(`NOT Pixel for video ${response['dsp']} - ${admcode}`);
                return false;
            }
            break;
        default:
            break;
    }

    if (ext['integrationType'] === 'vast') {
        let floor = request['imp'][0]['bidfloor'];
        admcode = admcode.replace(/\$\{AUCTION_ID\}/g, reqid).replace(/\$\{AUCTION_PRICE\}/g, floor.toString()).replace(/%24%7BAUCTION_PRICE%7D/g, floor.toString()).replace(/\$\{AUCTION_CURRENCY\}/g, 'USD').replace(/\$\{AUCTION_AD_ID\}/g, (response['data']['seatbid'][0]['bid'][0]['adid'] ? response['data']['seatbid'][0]['bid'][0]['adid'] : '')).replace(/\$\{AUCTION_SEAT_ID\}/g, (response['data']['seat'] ? response['data']['seat'] : dsp.id.toString())).replace(/\$\{AUCTION_IMP_ID\}/g, impid_).replace(/\$\{AUCTION_BID_ID\}/g, (response['data']['bidid'] ? response['data']['bidid'] : ''));
    }
    //GeoEdge
    if(Config.schain_domain == 'lunamedia.io' && type === 'banner' && sspPartner['geo_edge_scanning'] !== 0){
        admcode = addGetEdgeCreativeWrapper(sspPartner, dsp, response['data']['seatbid'][0]['bid'][0]['crid'], admcode);
    }

    objResponse['seatbid'][0]['bid'][0]['adm'] = admcode;

    if (adid) objResponse['seatbid'][0]['bid'][0]['adid'] = adid;

    if (type === 'banner') {
        /*if (adid !== '') {
            if (!iurltags[adid]) {
                if (globalStorage.cluster_config.pid == 4) {
                    if (!iurltagslearn[adid]) {
                        iurltagslearn[adid] = response['data']['seatbid'][0]['bid'][0]['adm'].replace(/\$\{AUCTION_PRICE\}/g, '0.01');
                    }
                }
            }
            objResponse['seatbid'][0]['bid'][0]['iurl'] = `${server}?t=preview2&k=${adid}`;
        }*/
    } else {
        if (response['data']['seatbid'][0]['bid'][0]['iurl']) {
            if (adid == '') adid = crypto.createHash('md5').update(response['data']['seatbid'][0]['bid'][0]['iurl']).digest('hex').substr(20);
            // Vova Memcached Issue
            redisClient.set(`preview_${adid}`, response['data']['seatbid'][0]['bid'][0]['iurl'], {'EX': 300})
            objResponse['seatbid'][0]['bid'][0]['iurl'] = `${server}?t=preview&k=${adid}`;
        }
    }

    if (response['data']['seatbid'][0]['bid'][0]['cat'] && response['data']['seatbid'][0]['bid'][0]['cat'].length > 0) {
        objResponse['seatbid'][0]['bid'][0]['cat'] = response['data']['seatbid'][0]['bid'][0]['cat'];
    }

    if (response['data']['seatbid'][0]['bid'][0]['attr'] && Array.isArray(response['data']['seatbid'][0]['bid'][0]['attr']) && response['data']['seatbid'][0]['bid'][0]['attr'].length > 0) {
        objResponse['seatbid'][0]['bid'][0]['attr'] = response['data']['seatbid'][0]['bid'][0]['attr'];
    }

    if (response['data']['seatbid'][0]['bid'][0]['cid'] && response['data']['seatbid'][0]['bid'][0]['cid'] != '0')
        objResponse['seatbid'][0]['bid'][0]['cid'] = `${globalStorage.dspPartners[response['dsp']]['id']}${Config.criddelimeter}${response['data']['seatbid'][0]['bid'][0]['cid']}`;
    else if (response['data']['seatbid'][0]['bid'][0]['crid'])
        objResponse['seatbid'][0]['bid'][0]['cid'] = `${globalStorage.dspPartners[response['dsp']]['id']}${Config.criddelimeter}${response['data']['seatbid'][0]['bid'][0]['crid']}`;
    else objResponse['seatbid'][0]['bid'][0]['cid'] = `${globalStorage.dspPartners[response['dsp']]['id']}${Config.criddelimeter}${Functions.hashCode(request['id'].toString() + globalStorage.dspPartners[response['dsp']]['id'].toString())}`;

    let oldcrid;
    if (response['data']['seatbid'][0]['bid'][0]['crid']) {
        oldcrid = response['data']['seatbid'][0]['bid'][0]['crid'];
        objResponse['seatbid'][0]['bid'][0]['crid'] = `${response['newcrid']}${Config.criddelimeter}${globalStorage.dspPartners[response['dsp']]['id']}`;
    } else {
        objResponse['seatbid'][0]['bid'][0]['crid'] = `${globalStorage.dspPartners[response['dsp']]['id']}${Config.criddelimeter}${Functions.hashCode(request['id'].toString() + globalStorage.dspPartners[response['dsp']]['id'].toString())}`;
        oldcrid = objResponse['seatbid'][0]['bid'][0]['crid'];
    }

    if (response['data']['seatbid'][0]['bid'][0]['api']) objResponse['seatbid'][0]['bid'][0]['api'] = response['data']['seatbid'][0]['bid'][0]['api'];

    const impUrl = `${(request['imp'][0]['secure'] == 1 ? serverssl : server)}?${Config.typeParameter}=${Config.impression}&${Config.secondPriceParameter}=\${AUCTION_PRICE}&${Config.dspParameter}=${globalStorage.dspPartners[response['dsp']]['id'].toString() + Config.criddelimeter + response['newcrid']}&${Config.extTracker}=1&${Config.trafficTypeParameter}=${Config.banner}&${Config.hashParameter}=${hash}`;
    switch (sspPartner['nurlimpression']) {
        case 1:
            objResponse['seatbid'][0]['bid'][0]['nurl'] = impUrl;
            break;
        case 2:
            objResponse['seatbid'][0]['bid'][0]['burl'] = impUrl;
            delete objResponse['seatbid'][0]['bid'][0]['nurl'];
            break;
        case 3:
            objResponse['seatbid'][0]['bid'][0]['ext'] = {
                'imptrackers': [impUrl]
            };
            delete objResponse['seatbid'][0]['bid'][0]['nurl'];
            break;
        default:
            break;
    }

    SSPConnectors.modifySSPFinalResponse(sspPartner, dsp, objResponse, impPixel);

    // const nurlImprData = {
    //     request: request,
    //     response: response,
    //     sspPartner: sspPartner,
    //     type: type,
    //     deviceType: device['devicetype'],
    //     dsp: dsp,
    // };
    //const nurlImprString = JSON.stringify(nurlImprData);

    //redisClient.set(`nurl_${hash}`, nurlImprString, {'EX': 15 * 60})
    //redisClient.set(`impr_${hash}`, nurlImprString, {'EX': 15 * 60})


    let scriptObj = {
        'pid': pubId,
        'originalPid': originalPubId,
        'domain': domain,
        'sid': siteId,
        'reqid': reqid,
        'realsid': siteId,
        'dsp': response['dsp'],
        'ssp': sspPartner['name'],
        'id': request['id'],
        'trafftype': trafftype,
        'subType': subType,
        'price': objResponse['seatbid'][0]['bid'][0]['price'],
        'nurl': `${(response['data']['seatbid'][0]['bid'][0]['nurl'] || response['data']['seatbid'][0]['bid'][0]['burl'])}`,
        'sspId': sspPartner['id'],
        'dspId': dsp.id,
        'isApp': (request['app'] ? 1 : 0),
        'country': device['geo']['country'],
        'region': device['geo']['region'],
        'city': device['geo']['city'],
        'devicetype': device['devicetype'],
        'dspSpend': ourpr,
        'w': objResponse['seatbid'][0]['bid'][0]['w'] || 0,
        'h': objResponse['seatbid'][0]['bid'][0]['h'] || 0,
        'nurlimpression': sspPartner['nurlimpression'],
        'bundle': (request['app'] ? source : 'none'),
        'type': type,
        'crid': oldcrid,
        'repackCrid': objResponse['seatbid'][0]['bid'][0]['crid'],
        'a_request': request,
        'a_response': response,
        'a_postDataString': JSON.parse(postDataString),
        'a_sspTmax': sspTmax,
    };


    if (response['data'] &&
        response['data']['seatbid'] &&
        response['data']['seatbid'][0] &&
        response['data']['seatbid'][0]['bid'] &&
        response['data']['seatbid'][0]['bid'][0] &&
        response['data']['seatbid'][0]['bid'][0]['burl']) {
        const burlObj = {
            'burl': response['data']['seatbid'][0]['bid'][0]['burl'],
            'a_request': request,
            'a_response': response,
            'type': type,
            'devicetype': device['devicetype'],
            'dspId': dsp.id,
            'sspId': sspPartner['id'],
            'dspSpend': ourpr,
            'repackCrid': objResponse['seatbid'][0]['bid'][0]['crid'],
            'a_postDataString': JSON.parse(postDataString),
            'a_sspTmax': sspTmax
        };
        redisClient.set(`burl_${hash}`, JSON.stringify(burlObj), {'EX': 15 * 60});
    }


    redisClient.set(`script_${hash}`, JSON.stringify(scriptObj), {'EX': memTtl})
    redisClient.set(`nurl_${hash}`, JSON.stringify(scriptObj), {'EX': 15 * 60})

    if (sspPartner['nurlimpression'] !== 0) {
        redisClient.set(`imptrack_${hash}`, JSON.stringify(scriptObj), {'EX': memTtl})
    }

// if (sspPartner['company'] == 'fyber'){
//     objResponse.seatbid[0].bid[0].burl = burl;
// }
    if (sspPartner['company'] == "pulsepoint" && objResponse.seatbid && objResponse.seatbid[0] && objResponse.seatbid[0].bid && objResponse.seatbid[0].bid[0] && !objResponse.seatbid[0].bid[0].attr){
        objResponse.seatbid[0].bid[0].attr = [];
    }

    return JSON.stringify(objResponse);
}

const vastFunc = (req, res, url_) => {
    let requestPath = url_;
    let keypass = (Config.usekeyname === 1 ? requestPath[Config.partnerkeyname] : '') + (Config.usepassname === 1 ? requestPath[Config.partnerkeypassname] : '');

    if (keypass === '' || supplyPartners[keypass] === undefined || !readyToJob) {
        return echoNoBidEnd(res);
    }

    if (supplyPartners[keypass]['active'] === 0 || supplyPartners[keypass]['active'] === -1) {
        return echoNoBidEnd(res);
    }

    if (supplyPartners[keypass]['spendlimit'] !== 0 && supplyPartners[keypass]['spendlimit'] < supplyPartners[keypass]['dailyspend']) {
        return echoNoBidEnd(res);
    }

    let ext = {
        integrationType : 'vast',
        originalSource: {
            companyName: supplyPartners[keypass]['company']
        }
    }

    if (CoreQPS[supplyPartners[keypass]['name']] !== undefined) {
        CoreQPS[supplyPartners[keypass]['name']]++;
    } else {
        CoreQPS[supplyPartners[keypass]['name']] = 1;
    }

    let bidRequest;

    try {
        bidRequest = vast.vastSupplyTransform(requestPath, supplyPartners[keypass]);
    } catch (e) {
        console.log(e);
        return echoNoBidEnd(res);
    }

    const error = checkMinBidRequestRequirements(bidRequest);
    if (error) {
        // console.log(`Request doesn't contain minimal requirements from ssp: ${supplyPartners[keypass]['name']}. Request: ${data}`);
        globalServices.sspMinRequirementsStatsService.detectedError(supplyPartners[keypass]['name'], error, JSON.stringify(bidRequest));
        return echoNoBidEnd(res);
    }


    reqResStorage.save('bidRequest', supplyPartners[keypass]['id'], bidRequest);

    // Vova_cleanup
    // sspRequestStatsService.countRequestsFromSSP(bidRequest, 'app', supplyPartners[keypass], Config.sspInfoKeys.TOTAL_REQUESTS);

    prepareBidRequest(res, bidRequest, supplyPartners[keypass], ext, 'app', 'video');
}

function showPreview(res, hash) {

    // globalServices.memcached.get(`preview_${hash}`, function (err, data) {
    redisClient.get(`preview_${hash}`, function (err, data) {
        if (data) {
            return echoRedirect(res, data);
        } else {
            return echoGoodEnd(res, '');
        }
    });
}

/*function showPreviewFull(res, adid) {
    if (!iurltags[adid]) {
        return echoGoodEnd(res, '');
    }

    globalServices.cached.iurltags.find({_id: adid}).limit(1).next((err, document) => {
        if (err) {
            console.error('Error while getting iurl for preview. Adid - ' + adid, err);
            return echoGoodEnd(res, '');
        }

        const body = (document && document.adm) ? document.adm : '';
        return echoEcho(res, `<html><head><title>Preview</title></head><body>${body}</body></html>`);
    });
}*/

/////////////////////////////stat functions
function showBids(res) {
    globalServices.cached.responseimpressions.find().toArray(function (err, data) {
        if (err) {
            console.error(err);
            res.end('err');
        } else {
            res.write("[");
            for (let i = 0; i < data.length; i++) {
                if (i != 0) res.write(",");

                res.write("{\"imps\": " + data[i]['cnt'] + ", \"ssp\": \"" + data[i]['ssp'] + "\", \"dsp\": \"" + data[i]['dsp'] + "\", \"bidprice\": " + data[i]['bidprice'] + ", \"ourbidprice\": " + data[i]['ourbidprice'] + "}");
            }
            res.end("]");

            if (data.length > 0) globalServices.cached.responseimpressions.deleteMany({}, function (err) {});
        }
    });
}

function isEmptyObject(obj) {
    for (let property in obj) {
        if (property && obj.hasOwnProperty(property)) {
            return false;
        }
    }
    return true;
}

//// Set Core for QPS
function setCoreQPS() {
    let timeKeepMemcachedData = 70;
    let coreID = globalStorage.cluster_config.pid; // id current core

    let qpsObj = {
        'CoreQPS': CoreQPS,
    };
    // Vova memcached fix
    redisClient.set(`ssp_qps_core_pid_${coreID}`, JSON.stringify(qpsObj), {'EX': timeKeepMemcachedData})

    CoreQPS = {};
}

setInterval(setCoreQPS, 60 * 1000); //60sec

//// Set QPS for Country
function setCountryCoreQPS(counter) {
    let timeKeepMemcachedData = 1830; // 30min (1800)
    let coreID = globalStorage.cluster_config.pid; // id current core

    if (CountryCoreQPS['writeObj'] !== undefined) {
        delete CountryCoreQPS['writeObj'];
    }

    if (!isEmptyObject(CountryCoreQPS)) {
        redisClient.set(`country_ssp_qps_core_pid_${coreID}`, JSON.stringify(CountryCoreQPS), {'EX': timeKeepMemcachedData})
    }

    if (counter) {
        CountryCoreQPS = {'writeObj': 1};
        setTimeout(setCountryCoreQPS, 60 * 1000);
    } else {
        CountryCoreQPS = {'writeObj': 0};
    }
}

setTimeout(setCountryCoreQPS, 60 * 1000); // first start for recording time online 60(1 min)
setInterval(() => {
    setCountryCoreQPS(1);
}, 30 * 60 * 1000); //start recording at intervals 1800(30 min)

//// Set Count in Core BidResponse Qps DSP
function setCountCoreBidQpsDSP() {
    let timeKeepMemcachedData = 120; // 2min
    let coreID = globalStorage.cluster_config.pid; // id current core

    // Vova memcached
    redisClient.set(`bid_dsp_qps_core_pid_${coreID}`, JSON.stringify(globalStorage.CoreDSPqps), {'EX': timeKeepMemcachedData})

    //clear counter
    globalStorage.CoreDSPqps = {};

    return true;
}

setInterval(setCountCoreBidQpsDSP, 60 * 1000); //60sec

function setCountCoreMaxQpsDSP() {
    let timeKeepMemcachedData = 120; // 2min
    let coreID = globalStorage.cluster_config.pid; // id current core

    redisClient.set(`bid_dsp_maxqps_core_pid_${coreID}`, JSON.stringify(globalStorage.CoreMaxQpsDsp), {'EX': timeKeepMemcachedData})
    //clear counter
    globalStorage.CoreMaxQpsDsp = {};

    return true;
}

setInterval(setCountCoreMaxQpsDSP, 60 * 1000); //60sec

//// Set Count in Core BidResponse Qps DSP
function setCountCoreRealQpsDSP() {
    let timeKeepMemcachedData = 120; // 2min
    let coreID = globalStorage.cluster_config.pid; // id current core

    // Vova memcached
    redisClient.set(`real_dsp_qps_core_pid_${coreID}`, JSON.stringify(globalStorage.CoreRealQpsDsp), {'EX': timeKeepMemcachedData})

    //clear counter
    globalStorage.CoreRealQpsDsp = {};

    return true;
}

setInterval(setCountCoreRealQpsDSP, 60 * 1000); //60sec

//// Set Count in Core BidResponse Qps SSP
function setCountCoreQpsSSP() {
    let timeKeepMemcachedData = 120; // 2min
    let coreID = globalStorage.cluster_config.pid; // id current core

    redisClient.set(`ssp_qps_core_bid_pid_${coreID}`, JSON.stringify(globalStorage.CoreQpsSsp), {'EX': timeKeepMemcachedData})
    //clear counter
    globalStorage.CoreQpsSsp = {};

    return true;
}

setInterval(setCountCoreQpsSSP, 60 * 1000); //60sec

async function getAvrQpsSsp(res, urlKey) {
    if (statpass === urlKey) {

        let timeSetCoreQPS = 60;
        let allCore = parseInt(globalStorage.cluster_config.maxpid); //count core

        let keysMemcached = []; //get all key Memcached
        for (let i = 0; i < allCore; i++) {
            keysMemcached.push('ssp_qps_core_pid_' + i);
        }


        redisClient.mGet(keysMemcached)
            .then(coreData => {
                // Handle the success outcome
                let sumQPSssp = {}; //sum QPS ssp partner
                let i;

                for (i = 0; i < coreData.length; i++) {
                    let j;

                    let coreItem
                    try {
                        coreItem = JSON.parse(coreData[i])
                    } catch (e) {
                        console.error(`can't parse ${coreData[i]}`)
                        return
                    }
                    let keys2 = Object.keys(coreItem['CoreQPS']);
                    let keys2_l = keys2.length;

                    for (j = 0; j < keys2_l; j++) {
                        if (sumQPSssp[keys2[j]]) {
                            sumQPSssp[keys2[j]] = sumQPSssp[keys2[j]] + (coreItem['CoreQPS'][keys2[j]] / timeSetCoreQPS);
                        } else {
                            sumQPSssp[keys2[j]] = (coreItem['CoreQPS'][keys2[j]] / timeSetCoreQPS);
                        }
                    }
                }

                if (!isEmptyObject(sumQPSssp)) {
                    let responseObj = {
                        'sspqps': sumQPSssp,
                    };
                    echoGoodEnd(res, JSON.stringify(responseObj));
                    return;
                }
                echoNoBidEnd(res);
                return true;
            })
            .catch(error => {
                // Handle any errors
                console.error('error memcached.getMulti:', err_mem);
            });
    } else {
        echoBadEnd(res);
        return false;
    }
}

async function getAvrQps(res, urlKey, key) {

    if (statpass === urlKey) {
        let timeSetCoreQPS = 60; //
        let allCore = parseInt(globalStorage.cluster_config.maxpid); //count core

        let keysMemcached = []; //get all key Memcached
        for (let i = 0; i < allCore; i++) {
            // keysMemcached.push('bid_dsp_qps_core_pid_' + i);
            // keysMemcached.push('real_dsp_qps_core_pid_' + i);
            keysMemcached.push(`${key}_${i}`);
        }

        let coreData
        try {
            coreData = await redisClient.mGet(keysMemcached);
            for(let i = 0; i < coreData.length; i++) {
                coreData[i] = JSON.parse(coreData[i])
            }
            // console.log(coreData); // Process your data here
        } catch (err_mem) {
            console.error('error memcached.getMulti:', err_mem);// Handle error
        }

        let sumQPS = {}; //sum QPS

        for (let i = 0; i < coreData.length; i++) {
            let j;
            let keys2 = Object.keys(coreData[i]);
            let keys2_l = keys2.length;
            // console.log(coreData[i])
            // console.log(keys2)
            for (j = 0; j < keys2_l; j++) {
                if (sumQPS[keys2[j]]) {
                    sumQPS[keys2[j]] += (coreData[i][keys2[j]] / timeSetCoreQPS);
                } else {
                    sumQPS[keys2[j]] = (coreData[i][keys2[j]] / timeSetCoreQPS);
                }
            }
        }

        // console.log(sumQPS)
        if (!isEmptyObject(sumQPS)) {
            echoGoodEnd(res, JSON.stringify(sumQPS));
            return;
        }
        echoNoBidEnd(res);
        return true;
    } else {
        echoBadEnd(res);
        return false;
    }
}

function checkMinBidRequestRequirements(bidRequest) {
    if (bidRequest['id'] === undefined) return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_ID;
    if (bidRequest['device'] === undefined) return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_DEVICE;
    if (!bidRequest['device']['ua']) return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_DEVICE_UA;
    if (bidRequest['imp'] === undefined) return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_IMP;
    if (bidRequest['imp'][0] === undefined) return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_IMP_0;
    if (ServerConfig.useSSL === false && bidRequest['imp'][0]['secure'] === 1)
        return globalServices.sspMinRequirementsStatsService.errorsList.INVALID_IMP_0_SECURE;

    if (!bidRequest['device']['ip'] &&
        !bidRequest['device']['ipv6'] &&
        !(bidRequest['regs']
            && bidRequest['regs']['ext']
            && bidRequest['regs']['ext']['gdpr'] === 1))
        return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_DEVICE_IP;

    if (bidRequest['imp'][0]['native'] == undefined
        && bidRequest['imp'][0]['banner'] == undefined
        && bidRequest['imp'][0]['audio'] == undefined
        && bidRequest['imp'][0]['video'] == undefined)
        return globalServices.sspMinRequirementsStatsService.errorsList.UNKOWN_REQUEST_TYPE;

    if (bidRequest['imp'][0]['native'] !== undefined && bidRequest['imp'][0]['native']['request'] == undefined)
        return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_IMP_0_NATIVE_REQUEST;

    if (bidRequest['imp'][0]['banner'] !== undefined)
        if (!(bidRequest['imp'][0]['banner']['w'] && bidRequest['imp'][0]['banner']['h'])
            && !bidRequest['imp'][0]['banner']['format'])
            return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_IMP_0_BANNER_SIZE;

    if (bidRequest['app'] === undefined && bidRequest['site'] === undefined)
        return globalServices.sspMinRequirementsStatsService.errorsList.UNKOWN_PLATFORM_TYPE;

    if (bidRequest['app'] !== undefined)
        if (!bidRequest['app']['bundle'] && !bidRequest['app']['domain'])
            return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_APP_BUNDLE;

    if (bidRequest['site'] !== undefined) {
        if (!bidRequest['site']['page'] && !bidRequest['site']['domain']) return globalServices.sspMinRequirementsStatsService.errorsList.EMPTY_SITE_DOMAIN;
        if (bidRequest['site']['domain']?.startsWith('com.')) return 'missmatching';
    }

    return false;
}

let readcloseObj = {
    [Config.API.updateSavedCreatives]: (obj) => {
        savedTags = obj;
    },
    [Config.API.updateSitePricesNew]: (obj) => {
        siteAVGPrice = obj;
    },
    [Config.API.adapter]: (obj) => {
        adapterdsp = obj;
    },
    [Config.API.updatePornList]: (obj) => {
        pornList = obj;
    },
    [Config.API.updateBlockedPublishers]: (obj) => {
        blockedPublishers = obj;
    },
    [Config.API.updateXandrPlacements]: (obj) => {
        globalStorage.xandrPlacements = obj;
    },
    [Config.API.updateAdformPlacements]: (obj) => {
        globalStorage.adformPlacements = obj;
    },
    [Config.API.updateExcludeSSP]: (obj) => {
        excludeSSP = obj;
    },
    [Config.API.updateSSPSettings]: (obj) => {
        supplyPartners = obj;
        Object.keys(supplyPartners).forEach(ssp => {
            supplyPartners[ssp]['allowedDSP'].length = Object.keys(supplyPartners[ssp]['allowedDSP']).length;
            supplyPartners[ssp]['blockDomains'] = supplyPartners[ssp]['blockDomains'] === 'null' ? null : new RegExp(supplyPartners[ssp]['blockDomains'], 'ig');
        })
    },
    [Config.API.updateDSPSettingsNew]: (obj) => {
        ModelDSP.setUpDSP(obj)
    },
    [Config.API.updateDSPBlockedSites]: (obj) => {
        blockedSites = obj;
    },
    [Config.API.updateBlockedCrids]: (obj) => {
        blockedCrids = obj;
    },
    [Config.API.updateGlobalBlackList]: (obj) => {
        blockedSitesGlobal = obj;
    },
    [Config.API.updateGlobalBlackListApps]: (obj) => {
        blockedAppsGlobal = obj;
    },
    [Config.API.updateDSPBlockedBundles]: (obj) => {
        blockedBundles = obj;
    },
    [Config.API.updateDSPBlockedAppNames]: (obj) => {
        blockedAppNames = obj;
    },
    [Config.API.updateDSPAllowedSites]: (obj) => {
        allowedSites = obj;
    },
    [Config.API.updateDSPAllowedBundles]: (obj) => {
        allowedBundles = obj;
    },
    [Config.API.updateDSPAllowedPublishers]: (obj) => {
        allowedPublishers = obj;
    },
    [Config.API.updateDSPAllowedCarriers]: (obj) => {
        allowedCarriers = obj;
    },
    [Config.API.updateWinrates]: (obj) => {
        globalStorage.sspDspRate = obj;
    },
    [Config.API.updateBlockedCreativesTMT]: (obj) => {
        blockedCreativesTMT = obj;
    },
    [Config.API.updateBlockedDomainsTMT]: (obj) => {
        blockedDomainsTMT = obj;
    },
    [Config.API.updateSSPBlockedPubs]: (obj) => {
        blockedSSPPubs = obj;
    },
    [Config.API.updateCachedCreativesTMT]: (obj) => {
        checkedCreativesTMT = obj;
    },
    [Config.API.updateAllowedCridTMT]: (obj) => {
        allowedCreativesTMT = obj;
    },
    [Config.API.updatePixalateFraudCH]: (obj) => {
        pixalateKeys = obj;
    },
    [Config.API.updateDSPAllowedSizes]: (obj) => {
        allowedSizes = obj;
    },
    [Config.API.updateSyncedPartners]: (obj) => {
        globalServices.userSync.setSyncedPartners(obj);
    },
    [Config.API.updateConfirmedBundles]: (obj) => {
        globalStorage.confirmedBundles = obj;
    },
    [Config.API.updateCheckedBundles]: (obj) => {
        globalStorage.checkedBundles = obj;
    },
    [Config.API.updateCustomSSP]: (obj) => {
        globalStorage.customSSP = obj;
    },
    [Config.API.updateSspSeller]: (obj) => {
        globalStorage.sspSeller = obj;
    },
    [Config.API.updateDirectSchain]: (obj) => {
        global.globalStorage.directSchain = obj;
    },
    [Config.API.updateInDirectSchain]: (obj) => {
        global.globalStorage.inDirectSchain = obj;
    }
};

function receiveData(req, res, keypass) {

    streamToString(req, (err, data) => {
        if (data === '') {
            console.log('Empty request from', supplyPartners[keypass]['name']);
            return echoNoBidEnd(res);
        }

        reqResStorage.save('bidRequest', supplyPartners[keypass]['id'], data);

        let objBody = null;
        try {

            // if ( supplyPartners[keypass]['name'] === 'pubnative_banner_ia_wl_US_EAST') {
            //     console.log(data)
            //     return echoNoBidEnd(res);
            // }

            objBody = JSON.parse(data);
        } catch (e) {

            Log('error', `Request parse error. SSP: ${supplyPartners[keypass]['name']}, error details: ${e.name}: ${e.message}`);
            console.log(data)
            globalServices.sspMinRequirementsStatsService.detectedError(supplyPartners[keypass]['name'], globalServices.sspMinRequirementsStatsService.errorsList.PARSE_ERROR, data);
            return echoNoBidEnd(res);
        }
        if (objBody === null) return echoNoBidEnd(res);


        //check min sets of request
        const error = checkMinBidRequestRequirements(objBody);
        if (error) {
            //console.log(`Request doesn't contain minimal requirements from ssp: ${supplyPartners[keypass]['name']}. Request: ${data} , ERROR: ${error}`);
            globalServices.sspMinRequirementsStatsService.detectedError(supplyPartners[keypass]['name'], error, data);
            return echoNoBidEnd(res);
        }

        const platformType = objBody['app'] ? 'app' : 'site';

        // Vova_cleanup
        // sspRequestStatsService.countRequestsFromSSP(objBody, platformType, supplyPartners[keypass], Config.sspInfoKeys.TOTAL_REQUESTS);

        const ext = {reqHeaders: req.headers || {}};

        if (supplyPartners[keypass]['name'] === 'cleverads_publisher_US_EAST') {
            let resp = getRandCreative(objBody);
            return echoGoodEnd(res, resp);
        }

        //choose type traffic
        if (objBody['imp'][0]['banner']) {
            prepareBidRequest(res, objBody, supplyPartners[keypass], ext, platformType, 'banner');
        } else if (objBody['imp'][0]['native']) {
            prepareBidRequest(res, objBody, supplyPartners[keypass], ext, platformType, 'native');
        } else if (objBody['imp'][0]['video']) {
            prepareBidRequest(res, objBody, supplyPartners[keypass], ext, platformType, 'video');
        } else if (objBody['imp'][0]['audio']) {
            prepareBidRequest(res, objBody, supplyPartners[keypass], ext, platformType, 'audio');
        }
    });
}

//Start on.request server
let readyToJob = false;
setTimeout(() => {
    readyToJob = true;
}, 70000);

function handlerRequest(req, res) {
    /////////////////////////////////////BID REQUEST
    let content = '';
    if (req.method === 'POST') {
        let keypass = urlp.parse(req.url, true).query;

        switch (keypass['secret_key']) {
            case 'START_LOG_WRITING':
                req.on('error', (err) => {
                    if (err) console.error(err);
                });

                content = '';

                req.on('data', (chunk) => {
                    content += chunk;
                });

                req.on('end', () => {
                    res.setTimeout(20 * 60 * 1000);

                    if (content.length < 1) {
                        console.log('Post request error (logs)');
                        res.end('');
                        return false;
                    }

                    process.send({'name': 'startLog', 'val': content});
                    let parameters = {};

                    try {
                        console.log('Parameters good: ' + content);
                        parameters = JSON.parse(content);
                    } catch (e) {
                        console.log('Parameters: ' + content);
                        console.log('Parse log parameters error: ' + e);
                        res.end('');
                        return false;
                    }

                    setTimeout(() => {

                        console.log('Log end!');
                        process.send({'name': 'logEnd', 'val': ''});

                        setTimeout(() => {
                            let obj = {};
                            fs.readFile('/nodejs/node_logs/logobject.txt', (err, data) => {
                                data = data.toString().split('\n');
                                data.splice(-1);
                                data.forEach((item, i, arr) => {
                                    item = JSON.parse(item);
                                    if (typeof item === 'object') {
                                        Object.keys(item).forEach((key) => {
                                            item[key]['req'] = (item[key]['req'] / (parseInt(parameters['time']) * 60));
                                            let count = item[key]['bf'].length;
                                            if (Array.isArray(item[key]['bf'])) {
                                                item[key]['bf'] = item[key]['bf'].reduce((total, num) => {
                                                    return parseFloat(total) + parseFloat(num);
                                                }) / count;
                                            } else {
                                                item[key]['bf'] = [0];
                                            }
                                            if (!obj[key]) {
                                                obj[key] = {
                                                    req: item[key]['req'],
                                                    bf: item[key]['bf']
                                                };
                                            } else {
                                                obj[key].req += item[key]['req'];
                                            }
                                        });
                                    }
                                });
                                let result = JSON.stringify(obj);

                                console.log('Send back...');
                                console.log('result: ' + result);
                                res.writeHead(200, {
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
                                    'Content-Type': 'application/json; charset=UTF-8',
                                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                                    'Content-Length': Buffer.byteLength(result, 'utf8')
                                });//content type
                                res.end(result);
                                fs.unlinkSync('/nodejs/node_logs/logobject.txt');
                            })

                        }, 10000)

                    }, parseInt(parameters['time']) * 60 * 1000); // 5 min for convenience

                });
                break;
            case 'EXTEND_LOGS':
                req.on('error', (err) => {
                    if (err) console.error(err);
                });

                content = '';

                req.on('data', (chunk) => {
                    content += chunk;
                });

                req.on('end', () => {
                    if (content.length < 1) {
                        console.log('Post request error (logs)');
                        res.end('');
                        return false;
                    }
                    let params;
                    try {
                        console.log('Extended log parameters good: ' + content);
                        params = JSON.parse(content);
                        let extendedLog = params;
                        let dspName;
                        Object.keys(globalStorage.dspPartners).forEach(key => {
                            if (globalStorage.dspPartners[key].id === extendedLog.id) {
                                dspName = key;
                            }
                        });
                        extendedLog.logName = dspName + '_' + new Date().getTime();
                        process.send('extLogs|' + JSON.stringify(extendedLog));
                        let resultUrl = 'http://' + ServerConfig.serverip + '/?t=getfile&k=' + extendedLog.logName;
                        res.writeHead(200, {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                            'Content-Length': Buffer.byteLength(resultUrl, 'utf8')
                        });
                        res.end(resultUrl);
                    } catch (e) {
                        console.log('Extended log parameters: ' + content);
                        console.log('Parse log parameters error: ' + e);
                        res.end('');
                        return false;
                    }
                });
                break;
            default:

                // realRequestsCounter.inc()
                keypass = (Config.usekeyname === 1 ? keypass[Config.partnerkeyname] : '') + (Config.usepassname === 1 ? keypass[Config.partnerkeypassname] : '');

                PrometheusService.getInstance().inc('ad_ex_requests', { ssp_name: 'total'});


                if (keypass === '' || supplyPartners[keypass] === undefined) {
                    PrometheusService.getInstance().inc('ad_ex_requests', { ssp_name: 'undefined'});
                    if (CoreQPS['unknow_ssp'] !== undefined) {
                        CoreQPS['unknow_ssp']++;
                    } else {
                        CoreQPS['unknow_ssp'] = 1;
                    }
                    return echoNoBidEnd(res);
                }

                if (readyToJob === false) {
                    PrometheusService.getInstance().inc('ad_ex_not_ready');
                    return echoNoBidEnd(res);
                }
                //// add SSP and count QPS Core
                PrometheusService.getInstance().inc('ad_ex_requests', { ssp_name: supplyPartners[keypass]['name']});

                if (CoreQPS[supplyPartners[keypass]['name']] !== undefined) {
                    CoreQPS[supplyPartners[keypass]['name']]++;
                } else {
                    CoreQPS[supplyPartners[keypass]['name']] = 1;
                }

                if (supplyPartners[keypass]['active'] === 0 || supplyPartners[keypass]['active'] === -1) {
                    //prometheusInstance.inc('ad_ex_inactive_supply_partner_requests_total', { total: 'total', ssp_name: supplyPartners[keypass]['name'] });
                    return echoNoBidEnd(res);
                }

                if (supplyPartners[keypass]['spendlimit'] !== 0 && supplyPartners[keypass]['spendlimit'] < supplyPartners[keypass]['dailyspend']) {
                    //prometheusInstance.inc('ad_ex_spend_limit_exceeded_requests_total', { total: 'total', ssp_name: supplyPartners[keypass]['name'] });
                    return echoNoBidEnd(res);
                }
                // return echoNoBidEnd(res);
                receiveData(req, res, keypass);
        }

    }
    /////////////////////////////////////////////////// OTHER FUNCTIONALY
    else if (req.method === 'GET') {
        try {
            var url_ = urlp.parse(req.url, true);
            var path_ = url_.pathname;
            url_ = url_.query;
        } catch (e) {
            console.error(`URL ERROR: ${e}`);
        }

        if (url_) {
            let content = {};
            let ext = {};
            switch (getMethod(url_, path_)) {
                case 'vast':
                    vastFunc(req, res, url_);
                    break;
                case 'click':
                    click(req, res, url_);
                    break;
                case 'impression':
                    impression(req, res, url_);
                    break;
                case 'win':
                    win(req, res, url_);
                    break;
                case 'burl':
                    //we don`t call burl, just return ''
                    callBurl(req, res, url_);
                    break;
                case 'lurl':
                    callLurl(req, res, url_);
                    break;
                case 'showPreview':
                    showPreview(res, url_['k']);
                    break;
                case 'showPreviewFull':
                    console.log('show preview')
                    res.end('');
                    // showPreviewFull(res, url_['k']);
                    break;
                case 'showBids':
                    showBids(res);
                    break;
                case 'getAvrQPS':
                    getAvrQpsSsp(res, url_['k']);
                    break;
                case 'getAvrRealQpsDSP':
                    getAvrQps(res, url_['k'], 'real_dsp_qps_core_pid');
                    break;
                case 'getAvrBidQpsDSP':
                    getAvrQps(res, url_['k'], 'bid_dsp_qps_core_pid');
                    break;
                case 'getAvrMaxQpsDSP':
                    getAvrQps(res, url_['k'], 'bid_dsp_maxqps_core_pid');
                    break;
                case 'getCountryAvrQPS':
                    getAvrQps(res, url_['k'], 'country_ssp_qps_core_pid');
                    break;
                case 'getAvrBidQpsSSP':
                    getAvrQps(res, url_['k'], 'ssp_qps_core_bid_pid');
                    break;
                case 'getSSPsMatchRates':
                    globalServices.userSync.getSSPsMatchRates(res);
                    echoGoodEnd(res, '');
                    break;
                case 'getDSPsMatchRates':
                    echoGoodEnd(res, '');
                    globalServices.userSync.getDSPsMatchRates(res);
                    break;
                case 'getLog':
                    echoLog(res);
                    break;
                case 'getfile':
                    //FIXME: results variable is not defined
                    echoGoodEnd(res, results);
                    break;
                default:
                    vastFunc(req, res, url_);
                    break;
            }
        } else {
            res.end('');
            return false;
        }
    } else {
        //console.error('Not found HTTP method = ', req.method);
        res.end('');
        return false;
    }
}

let HTTPServer = http.createServer();
HTTPServer.on('connection', (socket) => {
    socket.setNoDelay(true);
});

HTTPServer.on('request', handlerRequest);

HTTPServer.listen(80);

if (ServerConfig.useSSL) {
    https.createServer({
        'key': fs.readFileSync(ServerConfig.SSLKey),
        'cert': fs.readFileSync(ServerConfig.SSLCert),
        'ca': [fs.readFileSync('/nodejs/ad_ex/node_server/libs/cert/ca1.crt'), fs.readFileSync('/nodejs/ad_ex/node_server/libs/cert/ca2.crt'), fs.readFileSync('/nodejs/ad_ex/node_server/libs/cert/ca3.crt')]
    }, handlerRequest).listen(443);
}
