'use strict';

const crypto                = require('crypto');
const nativeModule          = require('../modules/native');
const { version }           = require('uuid');
const { getRandomInt }      = require('../Functions');
const objects               = require('./objects.json');
const Config                = require('../configs/config.json');
const {PrometheusService} = require("../services/prometheus/prometheus.service");

const criteoZoneIds = {
    'native': '1758554',
    'video': '1758555',
    'banner': '1758553'
};

const criteoZoneIdsUSA = {
    'native': '1765995',
    'video': '1765996',
    'banner': '1765994'
};

const epsilon_bundles = {
    "432750508": "226847",
    "533173905": "212236",
    "596402997": "220042",
    "610391947": "212296",
    "731592936": "226848",
    "882507985": "212238",
    "920869470": "219838",
    "1206967173": "225627",
    "1261300725": "225906",
    "1352903262": "226852",
    "1370475630": "226853",
    "1488266461": "227172",
    "1511646233": "220025",
    "1523627747": "219993",
    "1524476197": "220073",
    "1524982746": "227142",
    "1529614832": "219827",
    "1537437728": "219802",
    "1540237278": "219989",
    "1540712425": "219938",
    "1545206038": "219859",
    "1549356463": "227143",
    "1549842948": "220075",
    "1550106216": "220012",
    "1550674740": "219988",
    "1556497052": "219997",
    "1558777522": "220019",
    "1562322785": "219844",
    "1562867488": "220016",
    "1579072162": "225360",
    "1580057848": "227170",
    "1582745578": "220063",
    "1586352197": "219845",
    "1586795332": "220031",
    "1599516030": "226813",
    "1641732564": "224813",
    "1667330464": "226846",
    "6443484197": "225358",
    "app.cobo.launcher": "215024",
    "art.color.planet.oil.paint.canvas.number.free": "216275",
    "art.color.planet.paint.by.number.game.puzzle.free": "216280",
    "com.bandagames.mpuzzle.gp": "225149",
    "com.chitralekha.tinyiron": "226849",
    "com.constructor.games": "226812",
    "com.CreaTeamMobile.NextbotsinBackrooms": "225805",
    "com.cww.cubecraft": "225845",
    "com.decor.life": "224818",
    "com.ducky.bikehill3d": "219801",
    "com.duellogames.FlipperDunk": "227175",
    "com.easybrain.art.puzzle": "216279",
    "com.easybrain.block.puzzle.games": "216277",
    "com.easybrain.jigsaw.puzzles": "216281",
    "com.easybrain.killer.sudoku.free": "216282",
    "com.easybrain.sudoku.android": "216278",
    "com.evolution.merge": "225844",
    "com.gameloft.android.anmp.glofta8hm": "212202",
    "com.gameloft.android.anmp.glofta9hm": "212209",
    "com.gameloft.android.anmp.gloftaghm": "212237",
    "com.gameloft.android.anmp.gloftdohm": "212200",
    "com.gameloft.android.anmp.gloftivhm": "212203",
    "com.gameloft.android.anmp.gloftl2hm": "212239",
    "com.gameloft.android.anmp.gloftpohm": "212201",
    "com.Gimzat.ColorsSorting": "227171",
    "com.hyperdivestudio.papersgradeplease": "225905",
    "com.imo.android.imoimbeta": "219797",
    "com.imo.android.imoimhd": "219805",
    "com.jhulse.lineup": "219861",
    "com.Kwalee.Tens": "226851",
    "com.loop.matchtile3d": "221990",
    "com.master.hotelmaster": "225368",
    "com.metajoy.puzzlegame.fc": "219826",
    "com.newpubco.hearts": "219841",
    "com.newpubco.spades": "221991",
    "com.oakgames.linked2248.numberpuzzle": "227173",
    "com.onebutton.jd": "220033",
    "com.onebutton.mrsuper": "225734",
    "com.playstrom.bob": "225356",
    "com.playstrom.dop2": "225361",
    "com.puzzlegame.puzzledom": "219963",
    "com.revolverolver.fliptrickster": "220014",
    "com.shockwavegames.car.thief.simulator": "225364",
    "com.supertapx.lovedots": "220074",
    "com.sushirolls.app": "225828",
    "com.tgame.bestiebreakup": "219843",
    "com.tgame.silhouetteartnew": "220032",
    "com.tgame.yesorno": "219839",
    "com.tilegarden.match3": "219799",
    "com.withbuddies.dice.free": "226811",
    "com.zimad.magicpaintings": "225863",
    "com.zimad.mpixel": "219790",
    "com.zjcgame.superdress": "220018",
    "com.zm.watersort": "225150",
    "games.vaveda.militaryoverturn": "224814",
    "happy.puzzle.merge.block.shoot2048.number.game.free": "220001",
    "in.playsimple.wordbingo": "220013",
    "loppipoppi.numbermatch": "225626",
    "sixpack.sixpackabs.absworkout.abexercises.tv": "219940",
    "su.canoe.zoo.elephant": "225357",
    "1452227871": "216274",
    "1278922336": "215163",
    "com.ack.hooplegend3d": "227174",
    "com.aws.android": "211769",
    "281940292": "210979",
    "1337667848": "219811",
    "com.openmygame.magicwordsearch": "219919",
    "1502447854": "227477",
    "1528844711": "227478",
    "com.unicostudio.hiddenwords": "228382",
    "com.playstrom.puzzle.pics": "228380",
    "com.aqupepgames.projectpepe": "228379",
    "1478273910": "228378",
    "com.unicostudio.tilematch": "228366",
    "com.muscle.rush": "228365",
    "1451505313": "228364",
    "1612619232": "228363",
    "com.kwalee.overtake": "228362",
    "com.oakgames.fused.numberpuzzle": "228403",
    "1549830426": "228402",
    "1601300817": "228400",
    "1581951555": "228510",
    "com.shaverma.shackledcubes": "228557",
    "com.kwalee.muddertrucker3d": "228555",
    "com.casual.computerhack": "228553",
    "com.furylion.makeup": "228552",
    "com.race.motorush": "228551",
    "com.kitkagames.fallbuddies": "228550",
    "com.welldonegames.InnEmpire": "228546",
    "com.supergame.ohmycar": "228545",
    "com.blazedays.perfectcoffee": "228544",
    "com.shaverma.lazyjump": "228542",
    "mobi.gameguru.flickgoal": "229291",
    "1642596906": "229290",
    "1565846479": "229288",
    "1461096984": "229287",
    "com.twist.hit": "229275",
    "com.bigstarkids.wordtravelportuguese": "229477",
    "com.unicostudio.blastfriends": "229476",
    "1552739736": "229475",
    "1568784560": "229474",
    "1625252883": "229473",
    "com.zimad.magicsolitairecollection": "229446",
    "1458095674": "229444",
    "1499138555": "229443",
    "com.zjcgame.cluehunter": "229681",
    "com.unicostudio.whois": "229649",
    "1543724110": "229663",
    "com.unicostudio.trickywords": "229664",
    "1564468425": "229679",
    "1503028915": "229644",
    "com.bigstarkids.numberspuzzle248": "229646",
    "com.zimad.magicnumber": "229647",
    "com.bigstarkids.wordtravelspanish": "229648",
    "com.rogueharbour.billionair.airport": "229641",
    "1523059518": "230744",
    "com.kwalee.wantedgp": "230746",
    "com.randomlogicgames.crossword": "230747",
    "com.syubestgames.teachersimulator": "230751",
    "com.protopiagames.forgeahead": "230752",
    "1448993473": "230759",
    "1474046667": "230760",
    "1468608983": "230763",
    "team.teagames.mergemonstersarmy": "230768",
    "1493705133": "230769",
    "com.oakgames.wordgame": "230770",
    "com.water.balls": "228401",
    "com.evolution.hyper": "230876",
    "com.casualgames.snack": "230879",
    "com.easybrain.dice.board.game": "230880",
    "com.tintash.nailsalon": "230881",
    "tr.com.apps.fashion.battle": "230978",
    "com.gamebrain.hexasort": "230907",
    "com.education.learn_english_six": "231803",
    "com.education.english_reading_six": "231794",
    "com.education.toefl_practice_six": "231795",
    "com.de.modern.bus.driving.car.parking.game.challenge": "231570",
    "com.de.car.parking.order.puzzle.game": "231801",
    "com.scopely.yux": "231994",
    "517539894": "231995",
    "com.circle38.photocircle": "231997",
    "1158042933": "232107",
    "1492055041": "227475",
    "in.playsimple.triple.tile.matchgame.pair.three.puzzle.object.royale": "233494",
    "com.numbergames.linked2248.tile.numberpuzzle2048": "233495",
    "com.jb.gokeyboard.theme.twpinkandblackfreekeyboard": "233496",
    "com.redraw.keyboard.theme.newkeyboard2018": "233497",
    "in.playsimple.word_up": "233535",
    "1301967636": "233542",
    "com.wordsearch.wordtrip.crossword.puzzle": "233562",
    "1563215345": "233563",
    "com.jb.gokeyboard.theme.tkkeyboardforgrandprime": "233614",
    "994855806": "233615",
    "com.infinitygames.solitaire": "233620",
    "com.rikudogames.maze": "233621",
    "com.balysv.loop": "233622",
    "com.infinitygames.loopenergy": "233623",
    "com.infinitygames.loophex": "233625",
    "com.infinitygames.spidersolitaire": "233626",
    "com.infinitygames.eureka": "233627",
    "1532760700": "233628",
    "1257074055": "233629",
    "1515143626": "233630",
    "com.infinitygames.harmony": "233760",
    "1604470073": "233774",
    "com.infinitygames.shapes": "233775",
    "com.infinitygames.linea": "233776",
    "com.mensch.nicht.argern.mens.erger.je.niet.mobilaxy": "233777",
    "com.NcznDesign.OneBallPuzzleGames.BrainTeasers": "233778",
    "1527569819": "233779",
    "com.tapanywhere.laseroverload": "233780",
    "com.unu.friends.card.games": "233781",
    "1490993527": "233786",
    "1592163826": "233793",
    "1483904390": "233794",
    "1445523670": "233795",
    "1512724873": "233796",
    "1441604477": "233797",
    "com.infinitygames.connection": "233798",
    "com.twelvemoments.musicparty": "233799",
    "com.mobilaxy.wild.card.party.online.games.with.friends": "233800",
    "com.bestdicegames.ludo.king.star.pachisi.mobilaxy": "233801",
    "com.infinitygames.merge": "233860",
    "games.wordlee.guess.word.puzzle": "233861",
    "1554053656": "233862",
    "com.infinitygames.laserquest": "233863",
    "com.shockvalor.traffix3d": "233864",
    "com.infinitygames.woodblocks3d": "233865",
    "com.infinitygames.swipe": "233866",
    "com.infinitygames.squareit": "233867",
    "com.infinitygames.poweron": "233868",
    "1604225740": "233869",
    "com.infinitygames.pipes": "234015",
    "1640475275": "234016",
    "1541520872": "234017",
    "1510739277": "233949",
    "com.infinitygames.furzies": "233950",
    "1661557200": "233952",
    "1608383210": "233954",
    "1577523817": "233956",
    "1480824981": "233958",
    "com.infinitygames.zensquares": "233960",
    "1443446174": "234643",
    "gg.now.client.android": "235073",
    "com.jb.gokeyboard.theme.twgokeyboardblack": "235025",
    "com.redraw.keyboard.theme.free2017goldkeyboard": "235068",
    "com.onehundredpics.onehundredpicsquiz": "235026",
    "com.jb.gokeyboard.theme.twkeyboardpurplepassion": "235070",
    "com.jb.gokeyboard.theme.tmekeyboardred": "235072",
    "com.amanotes.duettiles": "234641",
    "6450888216": "234642",
    "1492267122": "234638",
    "1462186961": "234639",
    "1493892570": "234640"
}

/* Used for prebid addapter, predefined for dsp.
const _prebidExtConnector = (request, dspModel, type, size, isCTV) => {
    const source = request['app'] ? request['app']['bundle'] : request['site']['domain'];
    let placementId;
    if (!dspModel.id) return false;
    let t = isCTV ? 'ctv': type;

    return dspModel['prebidPayload'];
};
*/

module.exports.modifyPrebidRequest = (request, dspModel, type, size, isCTV) => {
    request['imp'][0]['ext'] = dspModel.prebidPayload;// _prebidExtConnector(request, dspModel, type, size, isCTV);
    if (!request['imp'][0]['ext']) return false;

    return request;
};

module.exports.modifyResponseEachDSP = (dspCompany, bidResponse, type) => {
    /* Magnite Integration
    switch (dspCompany) {
        case 'magnite':
            if (bidResponse['data']['seatbid'][0]['bid'][0]['adm'].indexOf('rubicon_cb') == 0) {
                bidResponse['data']['seatbid'][0]['bid'][0]['adm'] = "<script type='text/javascript'>" + bidResponse['data']['seatbid'][0]['bid'][0]['adm'] + "</script>";
            }
            break;
        default:
            break;
    }
    */
    return true;
};

module.exports.checkDSPRequestRequirements = (dspName, bidRequest, device, type) => {
    switch (globalStorage.dspPartners[dspName]['company']) {
        case 'sovrn':
            if (bidRequest.regs?.coppa >= 1) return `dspConnector`;
            break;
        case 'mock':
            if (bidRequest.regs?.coppa >= 1) return `dspConnector`;
            break;
        default:
            break;
    }
    return '';
};

module.exports.modifyFinalRequest = (dspName, sspPartner, placementParams, finalRequestObject, platformType, request, source, type, isCTV, size, headers, requestsByNativeSpec) => {
    const dsp = globalStorage.dspPartners[dspName];
    let rand, pubId, ownNode, nodes;

    if (type === 'native') {
        if (requestsByNativeSpec[dsp.nativeSpec] === undefined) {
            requestsByNativeSpec[dsp.nativeSpec] = nativeModule.getNativeForDSP(
                request['imp'][0]['native'],
                dsp.nativeSpec,
            );
        }

        if (requestsByNativeSpec[dsp.nativeSpec] === false) return false;

        finalRequestObject['imp'][0]['native']['request'] = requestsByNativeSpec[dsp.nativeSpec];
    }

    // REQUEST -> at
    finalRequestObject['at'] = dsp.at;

    // This section outlines the hierarchical processing of a request object through three distinct stages:
    // 1. `_proccessByCompany`: At this initial stage, the request object is processed based on company-specific logic. 
    //    For example, if the request contains a `tag` property, this method can fill or modify it with a value that's 
    //    relevant to the specific company associated with the request. This is crucial for tailoring the request 
    //    attributes to meet company-specific requirements or preferences, ensuring that the request is handled in a manner 
    //    that aligns with the company's policies or operational paradigms.

    // 2. `_proccessByDSPId`: Following the company-specific processing, the request is further refined based on the DSP (Demand-Side Platform) ID.
    //    This processing layer does not directly interact with the `tag` property but focuses on adjustments or additions 
    //    to the request that are pertinent to the DSP identified by `dsp.id`. This stage allows for customization and optimization
    //    of the request based on the characteristics or requirements of the DSP, which could involve aspects like targeting, 
    //    budget allocation, or bid strategies.

    // 3. `_proccessByEndpointName`: The final stage of request processing involves making adjustments based on the endpoint name, represented by `dspName`.
    //    It is at this stage where any special conditions related to endpoints are evaluated and acted upon. Notably, if there exists a special 
    //    condition for the `tag` property (e.g., if the endpoint necessitates a different `tag` value than what was previously set),
    //    this method has the authority to override or refill the `tag` property in the request object. This capability is critical for ensuring
    //    that the request fully complies with endpoint-specific rules or behaviors, allowing for precise control over how requests are 
    //    formulated and sent to different endpoints.

    // The described hierarchy allows for a flexible yet structured approach to request customization, ensuring that each request is 
    // optimally configured to meet the nuanced requirements of companies, DSPs, and specific endpoints. This layered process ensures 
    // that the final request object is the product of a comprehensive and tailored preparation workflow, maximizing the effectiveness 
    // and efficiency of the request handling process.
    _proccessByCompany(finalRequestObject, dsp.company, headers, platformType)
    _proccessByDSPId(finalRequestObject, dsp.id);
    _proccessByEndpointName(finalRequestObject, dspName, size, headers, platformType, type)


    return finalRequestObject;
};

function _proccessByDSPId(finalRequestObject, id){
    switch (id) {
        default:
            break;
    }
}

function _proccessByEndpointName(request, dspName, size, headers, platformType, type){
    let size_id
    switch(dspName  + Config.company_suffix){
        ///////1641
        case "magnite_xapi_direct_US_EAST":
            headers['Authorization'] =  'Basic bHVuYW1lZGlhOkFTTU1ZRkVKRDE=' //  new Buffer('pb_lunamedia:NKSVD8Y3BF').toString('base64') // ;
            size_id = objects.magniteSize[size];
            // if (type === 'video') {
            //     finalRequestObject['imp'][0]['video']['api'] = undefined;
            //     if (finalRequestObject['imp'][0]['instl'] === 1) {
            //         size_id = 202;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] === undefined || finalRequestObject['imp'][0]['video']['startdelay'] === 0) {
            //         size_id = 201;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] > 0 || finalRequestObject['imp'][0]['video']['startdelay'] === -1) {
            //         size_id = 204;
            //     }
            // }
            request['imp'][0]['banner']['ext'] = {
                rp: {
                    size_id: size_id
                }
            };
            if(globalStorage.magniteIntegration[request['app']['bundle']]) {
                request[platformType]['ext'] = {rp: {site_id: 521436}}
                request['imp'][0]['ext'] = {rp: {zone_id: 3439476}};
                request[platformType]['publisher']['ext'] = {rp: {account_id: 24170}};
            }
            // console.log(JSON.stringify(finalRequestObject))
            // if (type === 'banner') {
                if (!request.imp[0].banner.format) {
                    request.imp[0].banner.format = [
                        {
                            w: request.imp[0].banner.w,
                            h: request.imp[0].banner.h
                        }
                    ];
                }
                delete request['imp'][0]['banner']['hmax'];
                delete request['imp'][0]['banner']['wmax'];
                delete request['imp'][0]['banner']['hmin'];
                delete request['imp'][0]['banner']['wmin'];
            // }
            if (request['badv']) request['badv'].splice(30);
            // finalRequestObject['imp'][0]['bidfloor'] = 0.01;  //TODO: check it?

            // request[platformType].publisher.id = objects.magnitePubId[source];
            // finalRequestObject.source = {
            //     fd: 0,
            //     tid: finalRequestObject['id'],
            //     ext: {
            //
            //     }
            // };
            break;
            /////1642
        case "magnite_xapi_indirect_US_EAST":
            headers['Authorization'] =  'Basic bHVuYW1lZGlhOkFTTU1ZRkVKRDE=' //  new Buffer('pb_lunamedia:NKSVD8Y3BF').toString('base64') // ;
            size_id = objects.magniteSize[size];
            // if (type === 'video') {
            //     finalRequestObject['imp'][0]['video']['api'] = undefined;
            //     if (finalRequestObject['imp'][0]['instl'] === 1) {
            //         size_id = 202;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] === undefined || finalRequestObject['imp'][0]['video']['startdelay'] === 0) {
            //         size_id = 201;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] > 0 || finalRequestObject['imp'][0]['video']['startdelay'] === -1) {
            //         size_id = 204;
            //     }
            // }
            request['imp'][0]['banner']['ext'] = {
                rp: {
                    size_id: size_id
                }
            };
            if(globalStorage.magniteIntegration[request['app']['bundle']]) {
                request[platformType]['ext'] = {rp: {site_id: 521436}}
                request['imp'][0]['ext'] = {rp: {zone_id: 3439476}};
                request[platformType]['publisher']['ext'] = {rp: {account_id: 24170}};
            }
            // console.log(JSON.stringify(finalRequestObject))
            // if (type === 'banner') {
                if (!request.imp[0].banner.format) {
                    request.imp[0].banner.format = [
                        {
                            w: request.imp[0].banner.w,
                            h: request.imp[0].banner.h
                        }
                    ];
                }
                delete request['imp'][0]['banner']['hmax'];
                delete request['imp'][0]['banner']['wmax'];
                delete request['imp'][0]['banner']['hmin'];
                delete request['imp'][0]['banner']['wmin'];
            // }
            if (request['badv']) request['badv'].splice(30);
            // finalRequestObject['imp'][0]['bidfloor'] = 0.01;  //TODO: check it?

            // request[platformType].publisher.id = objects.magnitePubId[source];
            // finalRequestObject.source = {
            //     fd: 0,
            //     tid: finalRequestObject['id'],
            //     ext: {
            //
            //     }
            // };
            break;
            ////1640
        case "magnite_xapi_10_06_US_EAST":
            headers['Authorization'] =  'Basic bHVuYW1lZGlhOkFTTU1ZRkVKRDE=' //  new Buffer('pb_lunamedia:NKSVD8Y3BF').toString('base64') // ;
            size_id = objects.magniteSize[size];
            // if (type === 'video') {
            //     finalRequestObject['imp'][0]['video']['api'] = undefined;
            //     if (finalRequestObject['imp'][0]['instl'] === 1) {
            //         size_id = 202;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] === undefined || finalRequestObject['imp'][0]['video']['startdelay'] === 0) {
            //         size_id = 201;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] > 0 || finalRequestObject['imp'][0]['video']['startdelay'] === -1) {
            //         size_id = 204;
            //     }
            // }
            request['imp'][0]['banner']['ext'] = {
                rp: {
                    size_id: size_id
                }
            };
            if(globalStorage.magniteIntegration[request['app']['bundle']]) {
                request[platformType]['ext'] = {rp: {site_id: 521436}}
                request['imp'][0]['ext'] = {rp: {zone_id: 3136468}};
                request[platformType]['publisher']['ext'] = {rp: {account_id: 24170}};
            }
            // console.log(JSON.stringify(finalRequestObject))
            // if (type === 'banner') {
                if (!request.imp[0].banner.format) {
                    request.imp[0].banner.format = [
                        {
                            w: request.imp[0].banner.w,
                            h: request.imp[0].banner.h
                        }
                    ];
                }
                delete request['imp'][0]['banner']['hmax'];
                delete request['imp'][0]['banner']['wmax'];
                delete request['imp'][0]['banner']['hmin'];
                delete request['imp'][0]['banner']['wmin'];
            // }
            if (request['badv']) request['badv'].splice(30);
            // finalRequestObject['imp'][0]['bidfloor'] = 0.01;  //TODO: check it?

            // request[platformType].publisher.id = objects.magnitePubId[source];
            // finalRequestObject.source = {
            //     fd: 0,
            //     tid: finalRequestObject['id'],
            //     ext: {
            //
            //     }
            // };
            break;
        /////////1580
        case "mediagrid_ia_video_low_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "320x480":
                        request["imp"][0]['tagid'] = '413607';
                        break;
                    case "768x1024":
                        request["imp"][0]['tagid'] = '415017';
                        break;
                    case "480x320":
                        request["imp"][0]['tagid'] = '415018';
                        break;
                    case "1024x768":
                        request["imp"][0]['tagid'] = '415019';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1579
        case "mediagrid_ia_video_indirect_low_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "320x480":
                        request["imp"][0]['tagid'] = '413607';
                        break;
                    case "768x1024":
                        request["imp"][0]['tagid'] = '415017';
                        break;
                    case "480x320":
                        request["imp"][0]['tagid'] = '415018';
                        break;
                    case "1024x768":
                        request["imp"][0]['tagid'] = '415019';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1584
        case "mediagrid_video_direct_413607_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "320x480":
                        request["imp"][0]['tagid'] = '413607';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1737
        case "mediagrid_video_cb_320x480_416993_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "320x480":
                        request["imp"][0]['tagid'] = '416993';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1585
        case "mediagrid_video_indirect_top_413607_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "320x480":
                        request["imp"][0]['tagid'] = '413607';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1586
        case "mediagrid_video_direct_top_415018_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "480x320":
                        request["imp"][0]['tagid'] = '415018';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1587
        case "mediagrid_video_indirect_top_415018_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "480x320":
                        request["imp"][0]['tagid'] = '415018';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1588
        case "mediagrid_video_direct_top_415019_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "1024x768":
                        request["imp"][0]['tagid'] = '415019';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1589
        case "mediagrid_video_indirect_top_415019_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "1024x768":
                        request["imp"][0]['tagid'] = '415019';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1590
        case "mediagrid_video_direct_top_415017_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "768x1024":
                        request["imp"][0]['tagid'] = '415017';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1591
        case "mediagrid_video_indirect_top_415017_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "768x1024":
                        request["imp"][0]['tagid'] = '415017';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;
        /////////1747
        case "mediagrid_video_cb_320x480_416993_indirect_US_EAST":
            if (request["imp"] && request["imp"][0] && request["imp"][0]['video'] && request["imp"][0]['video']['w'] && request["imp"][0]['video']['h']) {
                const videoWidth = request["imp"][0]['video']['w'];
                const videoHeight = request["imp"][0]['video']['h'];

                switch(`${videoWidth}x${videoHeight}`) {
                    case "320x480":
                        request["imp"][0]['tagid'] = '416993';
                        break;
                    default:
                        PrometheusService.getInstance().inc('ad_ex_not_allowed_size', { dspName: dspName, w: videoWidth, h: videoHeight});
                        break;
                }
            }
            break;


/////1712
        case "pubmatic93_banner_direct_top_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5895854';
                }
            }
            break;
/////1713
        case "pubmatic93_banner_direct_low_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5895854';
                }
            }
            break;
/////1714
        case "pubmatic93_banner_indirect_top_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5895854';
                }
            }
            break;
/////1715
        case "pubmatic93_banner_indirect_low_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5895854';
                }
            }
            break;
/////1716
        case "pubmatic93_video_direct_top_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
/////1717
        case "pubmatic93_video_direct_low_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
/////1718
        case "pubmatic93_video_indirect_top_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
/////1719
        case "pubmatic93_video_indirect_low_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
/////1720
        case "pubmatic92_banner_direct_top_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025415';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025413';
                }
            }
            break;
/////1721
        case "pubmatic92_banner_direct_low_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025415';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025413';
                }
            }
            break;
        /////1722
        case "pubmatic92_banner_indirect_top_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025415';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025413';
                }
            }
            break;
        /////1723
        case "pubmatic92_banner_indirect_low_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025415';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025413';
                }
            }
            break;
        /////1724
        case "pubmatic92_video_direct_top_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025416';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025414';
                }
            }
            break;
        /////1725
        case "1725 pubmatic92_video_direct_low_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025416';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025414';
                }
            }
            break;
        /////1726
        case "pubmatic92_video_indirect_top_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025416';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025414';
                }
            }
            break;
        /////1727
        case "pubmatic92_video_indirect_low_US_EAST":
            if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5025416';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android') {
                if (request["imp"]) {
                    request["imp"][0]['tagid'] = '5025414';
                }
            }
            break;


/////1499
        case "pubmatic_ios_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
        break;
        /////1500
        case "pubmatic_android_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
        break;
        /////1507
        case "pubmatic_android_low_indirect_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "5895854";
            }
        break;
        /////1508
        case "pubmatic_android_top_indirect_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "5895854";
            }
        break;
        /////1509
        case "pubmatic_ios_low_indirect_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "5895853";
            }
        break;
        /////1510
        case "pubmatic_ios_top_indirect_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "5895853";
            }
        break;
        /////1556
        case "pubmatic_android_direct_low_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "5895854";
            }
            break;
        /////1555
        case "pubmatic_ios_direct_low_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "5895853";
            }
            break;
        /////1675
        case "pubmatic_ctv_top_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "4716027";
            }
            break;
        /////1676
        case "pubmatic_ctv_low_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "4716027";
            }
            break;
        /////1677
        case "pubmatic_ctv_futuretoday_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "4716027";
            }
            break;

        /////1593
        case "mediagrid_video_indirect_test_415569_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415569';
            }
            break;
        /////1594
        case "mediagrid_video_indirect_test_415570_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415570';
            }
            break;

        /////1604
        case "mediagrid_banner_direct_unity_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415619';
            }
            break;
        /////1605
        case "mediagrid_banner_direct_unity_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415619';
            }
            break;
        /////1736
        case "mediagrid_banner_cb_416992_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '416992';
            }
            break;
        /////1748
        case "mediagrid_banner_cb_416992_indirect_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '416992';
            }
            break;
        /////1608
        case "mediagrid_banner_indirect_unity_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415619';
            }
            break;
        /////1609
        case "mediagrid_banner_indirect_unity_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415619';
            }
            break;
        /////1606
        case "mediagrid_banner_direct_ironsource_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415620';
            }
            break;
        /////1607
        case "mediagrid_banner_direct_ironsource_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415620';
            }
            break;
        /////1610
        case "mediagrid_banner_indirect_ironsource_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415620';
            }
            break;
        /////1611
        case "mediagrid_banner_indirect_ironsource_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '415620';
            }
            break;
        /////1619
        case "pubmatic_ios_direct_unity_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1618
        case "pubmatic_ios_direct_unity_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1617
        case "pubmatic_ios_indirect_unity_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1616
        case "pubmatic_ios_indirect_unity_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1627
        case "pubmatic_ios_direct_ironsource_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1626
        case "pubmatic_ios_direct_ironsource_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1625
        case "pubmatic_ios_indirect_ironsource_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1624
        case "pubmatic_ios_indirect_ironsource_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895853';
            }
            break;
        /////1615
        case "pubmatic_android_indirect_unity_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1614
        case "pubmatic_android_indirect_unity_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1613
        case "pubmatic_android_direct_unity_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1612
        case "pubmatic_android_direct_unity_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1623
        case "pubmatic_android_indirect_ironsource_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1622
        case "pubmatic_android_indirect_ironsource_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1621
        case "pubmatic_android_direct_ironsource_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
        /////1620
        case "pubmatic_android_direct_ironsource_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5895854';
            }
            break;
            /////1558
        case "pubmatic_android_video_direct_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923889';
            }
            break;
        /////1557
        case "pubmatic_android_video_direct_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923889';
            }
            break;
        /////1560
        case "pubmatic_android_video_indirect_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923889';
            }
            break;
        /////1559
        case "pubmatic_android_video_indirect_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923889';
            }
            break;
        /////1561
        case "pubmatic_ios_video_direct_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923888';
            }
            break;
        /////1562
        case "pubmatic_ios_video_direct_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923888';
            }
            break;
        /////1563
        case "pubmatic_ios_video_indirect_low_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923888';
            }
            break;
        /////1564
        case "pubmatic_ios_video_indirect_top_US_EAST":
            if(request["imp"]){
                request["imp"][0]['tagid'] = '5923888';
            }
            break;
        /////1536
        case "mediagrid_video_320x480_413607_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "413607";
            }
        break;
        /////1680
        case "pubmatic_viber_banner_direct_US_EAST":
            if(request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '4740474';
                }
            } else if(request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '3580879';
                }
            }
            break;
        /////1681
        case "pubmatic_viber_web_US_EAST":
            if(type === 'banner'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '4928936';
                }
            } else if(type === 'video'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5239046';
                }
            } else if(type === 'native'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5527348';
                }
            }
            break;
        /////1679
        case "pubmatic_mobilityware_banner_video_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '3580879';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '4740474';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5477082';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5477083';
                }
            }
            break;
        /////1682
        case "pubmatic_weatherbug_nimbus_bann_vid_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1683
        case "pubmatic_smartnews_nimbus_bann_vid_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1684
        case "pubmatic_locketlabs_nimbus_bann_vid_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1685
        case "pubmatic_paltalk_nimbus_bann_vid_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1686
        case "pubmatic_Tappa_nimbus_banner_video_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1687
        case "pubmatic_photocircle_nimbus_ban_vid_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1738
        case "pubmatic93_chartboost_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1739
        case "pubmatic93_chartboost_indirect_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1740
        case "pubmatic92_chartboost_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1741
        case "pubmatic92_chartboost_indirect_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895853';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5895854';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923888';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5923889';
                }
            }
            break;
        /////1688
        case "pubmatic_lusomedia_nimbus_bann_vid_direct_US_EAST":
            if(type === 'banner' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '3580879';
                }
            } else if(type === 'banner' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '4740474';
                }
            } else if(type === 'video' && request.device && request.device.os === 'ios'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5477082';
                }
            } else if(type === 'video' && request.device && request.device.os === 'android'){
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '5477083';
                }
            }
            break;


        ///////1553
        case "unruly_rtb_banner_ia_direct_low_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;

        ///////1702
        case "unruly_rtb_banner_directpublishers_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;

        ///////1703
        case "unruly_rtb_video_directpublishers_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;

        ///////1705
        case "unruly_rtb_smartnews_direct_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;

        /////10021
        case "inmobi_ios_video_top_US_EAST_X1":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1698171656713";
            }
            break;
        /////10022
        case "inmobi_android_video_top_US_EAST_X1":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1692783594337";
            }
            break;
        /////20029
        case "inmobi_ios_video_1675664264724_top_US_EAST_X2":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1675664264724";
            }
            break;
        /////20030
        case "inmobi_ios_video_1684812081282_top_US_EAST_X2":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1684812081282";
            }
            break;
        /////20031
        case "inmobi_android_video_1672808950474_top_US_EAST_X2":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1672808950474";
            }
            break;
        /////20032
        case "inmobi_android_video_1682493979999_top_US_EAST_X2":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1682493979999";
            }
            break;
        /////30029
        case "inmobi_ios_video_top_US_EAST_X3":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1675626426745";
            }
            break;
        /////30030
        case "inmobi_android_video_top_US_EAST_X3":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1676396662123";
            }
            break;

        /////40017
        case "inmobi_android_banner_1669929706191_full_wl_US_EAST_X4":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1669929706191";
            }
            break;
        /////40018
        case "inmobi_ios_banner_1704108607243_full_wl_US_EAST_X4":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1704108607243";
            }
            break;
        /////40019
        case "inmobi_ios_banner_1680904956304_wl_US_EAST_X4":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1680904956304";
            }
            break;
        /////40020
        case "inmobi_ios_banner_1673621022491_wl_US_EAST_X4":
            if (request["imp"]) {
                request["imp"][0]["tagid"] = "1673621022491";
            }
            break;

        /////40001
        case "yeahmobi_banner_ia_indirect_top_US_EAST_X4":
            if (request["imp"] && request["imp"][0] && request["imp"][0]["tagid"]) {
                delete request["imp"][0]["tagid"]
            }

            if(request["regs"] && request["regs"]["ext"] && (request["regs"]["ext"]["gdpr"] !== 1 || !request["regs"]["ext"]["gdpr"])){
                if(request["ext"]){
                    request["ext"]["gdpr"] = 0
                }
            }

            if(request["regs"] && request["regs"]["ext"] && (request["regs"]["ext"]["gdpr"] !== 1 || !request["regs"]["ext"]["gdpr"]) && request["user"] && request["user"]["ext"] && (!request["user"]["ext"]["gdpr"] || request["user"]["ext"]["gdpr"] !== 1)){
                request["user"]["ext"]["gdpr"] = 0
            }

            if(request["regs"] && request["regs"]["ext"] && (request["regs"]["ext"]["coppa"] !== 1 || !request["regs"]["ext"]["coppa"])){
                if(request["ext"]){
                    request["regs"]["coppa"] = 0
                }
            }
            break;

        ///////1666
        case "freewheel_ctv_33707950_top_US_EAST":
            if(request["app"]){
                request.app.id = '33707950';
            }
            break;

        ///////1667
        case "freewheel_ctv_33707950_future_today_US_EAST":
            if(request["app"]){
                request.app.id = '33707950';
            }
            break;

            ///////1668
        case "freewheel_ctv_33707950_low_US_EAST":
            if(request["app"]){
                request.app.id = '33707950';
            }
            break;

        ///////1669
        case "freewheel_ctv_33706589_top_US_EAST":
            if(request["app"]){
                request.app.id = '33706589';
            }
            break;

        ///////1670
        case "freewheel_ctv_33706589_future_today_US_EAST":
            if(request["app"]){
                request.app.id = '33706589';
            }
            break;

        ///////1674
        case "unruly_ctv_futuretoday_US_EAST":
            if(request["app"]){
                request.app.id = '276591';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "276591";
            break;

        ///////1673
        case "unruly_ctv_low_US_EAST":
            if(request["app"]){
                request.app.id = '276591';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "276591";
            break;

        ///////1672
        case "unruly_ctv_top_US_EAST":
            if(request["app"]){
                request.app.id = '276591';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "276591";
            break;

        ///////1567
        case "unruly_rtb_video_ia_direct_low_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;
        ///////1565
        case "unruly_rtb_video_ia_direct_top_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;
        ///////1568
        case "unruly_rtb_video_ia_indirect_low_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;
        ///////1566
        case "unruly_rtb_video_ia_indirect_top_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;
        ///////1515
        case "unruly_banner_prebid_direct_low_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;
        ///////1571
        case "unruly_video_prebid_direct_low_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;
        ///////1569
        case "unruly_video_prebid_direct_top_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;

        ///////10018
        case "unruly_video_prebid_indirect_top_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;
        ///////10019
        case "unruly_video_prebid_direct_top_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;

        ///////10023
        case "unruly_video_prebid_indirect_low_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;
        ///////10024
        case "unruly_video_prebid_direct_low_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;
        ///////30033
        case "unruly_video_261637_low_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;
        ///////30034
        case "unruly_banner_261637_low_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;
        ///////30035
        case "unruly_banner_256591_low_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "256591";
            break;
        ///////30036
        case "unruly_video_256591_low_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "256591";
            break;

        ///////30044
        case "unruly_video_261637_push_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;
        ///////30045
        case "unruly_banner_261637_push_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;

        ///////1572
        case "unruly_video_prebid_indirect_low_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;
        ///////1570
        case "unruly_video_prebid_indirect_top_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;

        ///////10027
        case "unruly_banner_prebid_indirect_top_adp_test_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;

        ///////30046
        case "unruly_banner_261637_adp_test_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;

        ///////1516
        case "unruly_banner_prebid_direct_top_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;
        ///////1518
        case "unruly_banner_prebid_indirect_low_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;
        ///////1519
        case "unruly_banner_prebid_indirect_top_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;

///////1704
        case "unruly_prebid_web_luso_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "276901";
            break;

        ///////1706
        case "unruly_prebid_smartnews_direct_US_EAST":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247361";
            break;

        ///////20026
        case "unruly_video_ia_low_US_EAST_X2":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247057";
            break;

        ///////20025
        case "unruly_video_ia_top_US_EAST_X2":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247057";
            break;

        ///////1551
        case "unruly_rtb_banner_ia_direct_top_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;
        ///////1554
        case "unruly_rtb_banner_ia_indirect_low_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;
        ///////1552
        case "unruly_rtb_banner_ia_indirect_top_US_EAST":
            if(request["app"]){
                request.app.id = '274727';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "274727";
            break;


        ///////10010
        case "unruly_banner_prebid_direct_low_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;

        ///////40013
        case "unruly_prebid_video_ia_indirect_top_US_EAST_X4":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "254511";
            break;
        ///////40014
        case "unruly_prebid_video_ia_noschain_top_US_EAST_X4":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "254511";
            break;

        ///////10008
        case "unruly_banner_prebid_indirect_low_US_EAST_X1":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;

        ///////30016
        case "unruly_banner_261637_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;
        ///////30017
        case "unruly_video_261637_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "261637";
            break;
        ///////30018
        case "unruly_banner_256591_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "256591";
            break;
        ///////30019
        case "unruly_video_256591_US_EAST_X3":
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "256591";
            break;

            ///////40010
        case "unruly_rtb_banner_ia_direct_low_US_EAST_X4":
            if(request["app"]){
                request.app.id = '273945';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "273945";
            break;
        ///////40009
        case "unruly_rtb_banner_ia_direct_top_US_EAST_X4":
            if(request["app"]){
                request.app.id = '273945';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "273945";
            break;
        ///////400011
        case "unruly_rtb_banner_ia_indirect_low_US_EAST_X4":
            if(request["app"]){
                request.app.id = '273945';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "273945";
            break;
        ///////400012
        case "unruly_rtb_banner_ia_indirect_top_US_EAST_X4":
            if(request["app"]){
                request.app.id = '273945';
            }
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }
            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            request['imp'][0]['ext']['bidder']['placementId'] = "273945";
            break;

        ///////////1692
        case "stirista_luna-stirista-ctv_future_today_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-ctv",
                            "bidfloor": 5
                        }
                    ]
                };
            }
            break;

        ///////////1742
        case "stirista_luna-stirista-display_591560124_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "una-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1678
        case "stirista_luna-stirista-ctv_ron_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-ctv",
                            "bidfloor": 5
                        }
                    ]
                };
            }
            break;

        ///////////1691
        case "st_luna-stirista-display_nimbus_publishers_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1690
        case "stirista_luna-stirista-display_smartnews_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1689
        case "stirista_luna-stirista-display_weatherbug_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;

        ///////////1693
        case "stirista_luna-stirista-olv_no_games_list_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-olv",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;

        ///////////1541
        case "stirista_luna-stirista-display_low_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1538
        case "stirista_luna-stirista-display_top_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1542
        case "stiris_luna-stirista-display-political_low_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display-political",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1540
        case "stiris_luna-stirista-display-political_top_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display-political",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1543
        case "stiris_luna-stirista-political-general_low_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-political-general",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1539
        case "stiris_luna-stirista-political-general_top_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-political-general",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
        ///////////1710
        case "stirista_luna-stirista-display_inmobi_top_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
///////////1711
        case "stiris_luna-stirista-display_pubnative_top_US_EAST":
            if (request["imp"]) {
                request["imp"][0]["pmp"] = {
                    "private_auction": 1,
                    "deals": [
                        {
                            "at": 2,
                            "id": "luna-stirista-display",
                            "bidfloor": 1
                        }
                    ]
                };
            }
            break;
    }
}

function _proccessByCompany(request, company, headers, platformType){
    switch (company + Config.company_suffix) {
        // Magnite Integration
        case 'magnite':
            headers['Authorization'] =   'Basic cGJfbHVuYW1lZGlhOk5LU1ZEOFkzQkY=';//  new Buffer('pb_lunamedia:NKSVD8Y3BF').toString('base64')
            // let size_id = objects.magniteSize[size];
            // if (type === 'video') {
            //     finalRequestObject['imp'][0]['video']['api'] = undefined;
            //     if (finalRequestObject['imp'][0]['instl'] === 1) {
            //         size_id = 202;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] === undefined || finalRequestObject['imp'][0]['video']['startdelay'] === 0) {
            //         size_id = 201;
            //     } else if (finalRequestObject['imp'][0]['video']['startdelay'] > 0 || finalRequestObject['imp'][0]['video']['startdelay'] === -1) {
            //         size_id = 204;
            //     }
            // }
            // finalRequestObject['imp'][0][type]['ext'] = {
            //     rp: {
            //         size_id: size_id
            //     }
            // };
            if(globalStorage.magniteIntegration[request['app']['bundle']]) {
                    request[platformType]['ext'] = {rp: {site_id: globalStorage.magniteIntegration[request['app']['bundle']]['siteId']}}
                    request['imp'][0]['ext'] = {rp: {zone_id: globalStorage.magniteIntegration[request['app']['bundle']]['zoneId']}};
                    request[platformType]['publisher']['ext'] = {rp: {account_id: globalStorage.magniteIntegration[request['app']['bundle']]['accountId']}};
            }
            // console.log(JSON.stringify(finalRequestObject))
            // if (type === 'banner') {
            //     if (!finalRequestObject.imp[0].banner.format) {
            //         finalRequestObject.imp[0].banner.format = [
            //             {
            //                 w: finalRequestObject.imp[0].banner.w,
            //                 h: finalRequestObject.imp[0].banner.h
            //             }
            //         ];
            //     }
            //     delete finalRequestObject['imp'][0]['banner']['hmax'];
            //     delete finalRequestObject['imp'][0]['banner']['wmax'];
            //     delete finalRequestObject['imp'][0]['banner']['hmin'];
            //     delete finalRequestObject['imp'][0]['banner']['wmin'];
            // }
            // if (finalRequestObject['badv']) finalRequestObject['badv'].splice(45);
            // finalRequestObject['imp'][0]['bidfloor'] = 0.01;

            // finalRequestObject[platformType].publisher.id = objects.magnitePubId[source];
            // finalRequestObject.source = {
            //     fd: 0,
            //     tid: finalRequestObject['id'],
            //     ext: {
            //
            //     }
            // };
            break;
        case 'mediagrid':
                if(request["imp"]){
                    request["imp"][0]['tagid'] = '410958';
                }
                if (request.bcat) {
                    request.bcat = request.bcat.filter(category => !category.startsWith("BSW"));
                }

                if(request.app && request.app.content && request.app.content.context === 0){
                    request.app.content.context = 7
                }

                if(request.site && request.site.content && request.site.content.context === 0){
                    request.site.content.context = 7
                }

                if(request.app && request.app.content && request.app.content.qagmediarating == 0){
                    delete request.app.content.qagmediarating
                }
                if(request.site && request.site.content && request.site.content.qagmediarating == 0){
                    delete request.site.content.qagmediarating
                }

                if(request.device && request.device.geo && request.device.geo.lat && request.device.geo.lon){
                    let lat = request.device.geo.lat;
                    let lon = request.device.geo.lon;

                        if (lat >= 0) {
                            let latNum = request.device.geo.lat + 0.000001;
                            request.device.geo.lat = latNum;
                        } else {
                            let latNum = request.device.geo.lat - 0.000001;
                            request.device.geo.lat = latNum;
                        }

                        if (lon >= 0) {
                            let lonNum = request.device.geo.lon + 0.000001;
                            request.device.geo.lon = lonNum;
                        } else {
                            let lonNum = request.device.geo.lon - 0.000001;
                            request.device.geo.lon = lonNum;
                        }
                }

            break;
        // case 'unruly':
        //     if(!request.imp[0].ext){
        //         request.imp[0].ext = {}
        //     }
        //
        //     if(!request.imp[0].ext.bidder){
        //         request.imp[0].ext.bidder = {}
        //     }
        //
        //     request['imp'][0]['ext']['bidder']['siteId'] = "247361";
        //     break;
        case `unruly_X1`:
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "270616";
            break;
        case `unruly_X2`:
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }

            request['imp'][0]['ext']['bidder']['siteId'] = "247057";
            break;
        // case `unruly_X4`:
        //     if(!request.imp[0].ext){
        //         request.imp[0].ext = {}
        //     }
        //
        //     if(!request.imp[0].ext.bidder){
        //         request.imp[0].ext.bidder = {}
        //     }
        //
        //     request['imp'][0]['ext']['bidder']['siteId'] = "273945";
        //     break;
        case 'mock':
            if(request.site?.publisher?.id) {
                request.site.publisher.id = '4539'
            }
            if(request.app?.publisher?.id) {
                request.app.publisher.id = '4539'
            }
            break
        case 'equativ':
            if(request.site?.publisher?.id) {
                request.site.publisher.id = '4539'
            }
            if(request.app?.publisher?.id) {
                request.app.publisher.id = '4539'
            }

            break;
        case `epsilon`:
            if(!request.imp[0].ext){
                request.imp[0].ext = {}
            }

            if(!request.imp[0].ext.bidder){
                request.imp[0].ext.bidder = {}
            }
            const appBundle = request.app.bundle;

            if (appBundle && epsilon_bundles.hasOwnProperty(appBundle)) {
                request['imp'][0]['ext']['bidder']['site_id'] = epsilon_bundles[appBundle];
                if(request["app"]){
                    request.app.id = epsilon_bundles[appBundle];
                }
                if(request["site"]){
                    request.site.id = epsilon_bundles[appBundle];
                }
            } else {
                PrometheusService.getInstance().inc('epsilon_no_bundle', { appBundle: appBundle });
            }
            break;
        default:
            break;
    }
}
