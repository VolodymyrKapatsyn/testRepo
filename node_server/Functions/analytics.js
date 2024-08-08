const moment = require('moment');
const _ = require('lodash');
const del = '~~~';
let requestData = {};
let responseData ={};
let nurlsData ={};
let imprsData ={};
let ourRequestData = {};
let burlsData = {}

async function insertBidRequestIntoMongo(bidRequest, sspPartner, type, devicetype, server, sspTmax) {
    let deals = bidRequest.imp[0]?.pmp?.deal
    let pmpDeal = undefined

    if(bidRequest.imp[0]?.pmp?.deal && bidRequest.imp[0]?.pmp?.deal[0]) {
        pmpDeal = bidRequest.imp[0]?.pmp?.deal[0]
    }

    const bidRequestData = {
        p1: bidRequest.app?.bundle || bidRequest.site?.domain,
        p2: devicetype,
        p3: bidRequest.device?.os,
        p4: bidRequest.device?.geo?.country,
        p5: 'inapp', // TODO: fixme
        p6: Math.ceil(bidRequest.imp['0']?.bidfloor * 100) / 100,
        p7: type,
        p8: Math.ceil(sspTmax / 10) * 10,
        p9: `${bidRequest.imp['0']?.banner?.w || bidRequest.imp['0']?.w || bidRequest.imp['0']?.video?.w || ''}x${bidRequest.imp['0']?.banner?.h || bidRequest.imp['0']?.h || bidRequest.imp['0']?.video?.h ||''}`,
        p10: bidRequest.imp['0']?.video?.ext?.rewarded ? 1 : 0,
        p11: bidRequest.app?.publisher?.id || bidRequest.site?.publisher?.id,
        p12: sspPartner.id,
        p13: bidRequest.imp[0]?.pmp ? 1 : 0,
        p14: bidRequest.imp[0]?.pmp?.private_auction,
        p15: pmpDeal?.id,
        p16: isNaN(parseFloat(pmpDeal?.bidfloor)) ? undefined : Math.ceil(parseFloat(pmpDeal?.bidfloor) * 10) / 10,
        p17: bidRequest.imp[0]?.instl,
        p30: bidRequest.device?.model,
        p31: bidRequest.device?.osv,
        p32: bidRequest.device?.make,
        p33: bidRequest.device?.carrier,
        p35: bidRequest.device?.connectiontype,
        p36: bidRequest.device?.geo?.city,
        p37: bidRequest.device?.geo?.region,
        p38: bidRequest.app?.name || bidRequest.site?.name,
        p40: server,
};

    const filteredBidRequestData = Object.fromEntries(
        Object.entries(bidRequestData).filter(([key, value]) => value !== undefined && value !== null)
    );

    if (Object.keys(filteredBidRequestData).length === 0) {
        console.log('No valid data to insert into MongoDB.');
        return;
    }

    const roundMinutes = Math.floor(moment().minutes() / 5) * 5;
    const event_time = moment().startOf('hour').minutes(roundMinutes).format('YYYY-MM-DD-HH-mm');

    const key = (
        filteredBidRequestData.p1 +
        del + filteredBidRequestData.p2 +
        del + filteredBidRequestData.p3 +
        del + filteredBidRequestData.p4 +
        del + filteredBidRequestData.p5 +
        del + filteredBidRequestData.p6 +
        del + filteredBidRequestData.p7 +
        del + filteredBidRequestData.p8 +
        del + filteredBidRequestData.p9 +
        del + filteredBidRequestData.p10 +
        del + filteredBidRequestData.p11 +
        del + filteredBidRequestData.p12 +
        del + filteredBidRequestData.p13 +
        del + filteredBidRequestData.p14 +
        del + filteredBidRequestData.p15 +
        del + filteredBidRequestData.p16 +
        del + filteredBidRequestData.p17 +
        del + filteredBidRequestData.p30 +
        del + filteredBidRequestData.p31 +
        del + filteredBidRequestData.p32 +
        del + filteredBidRequestData.p33 +
        del + filteredBidRequestData.p35 +
        del + filteredBidRequestData.p36 +
        del + filteredBidRequestData.p37 +
        del + filteredBidRequestData.p38 +
        del + filteredBidRequestData.p40 +
        del + event_time
    ).toString();

    if (requestData[key]?.length > 0) {
        requestData[key].push({
            ...filteredBidRequestData,
            event_time: event_time,
        });
    } else {
        requestData[key] = [{
            ...filteredBidRequestData,
            event_time: event_time,
        }];
    }
}

async function addBidReqMongo() {
    try {
        if (Object.keys(requestData).length === 0) return;

        const requestDataCopy = _.cloneDeep(requestData);

        clearRequestsDataExch();
        const aggregatedData = {};

        for (const key of Object.keys(requestDataCopy)) {
            const dataArray = requestDataCopy[key];
            for (const dataItem of dataArray) {
                const dataKey = JSON.stringify(dataItem);
                if (aggregatedData[dataKey]) {
                    aggregatedData[dataKey].count += 1;
                } else {
                    aggregatedData[dataKey] = {
                        ...dataItem,
                        count: 1,
                    };
                }
            }
        }

        const batchSize = 5000;
        const dataKeys = Object.keys(aggregatedData);
        const batches = [];

        for (let i = 0; i < dataKeys.length; i += batchSize) {
            const batchKeys = dataKeys.slice(i, i + batchSize);
            const batchItems = batchKeys.map(key => aggregatedData[key]);
            batches.push(batchItems);
        }
        const requests = batches.map(batch => {
            return globalServices.cached.bidRequests.insertMany(batch).catch(err => {
                console.error('Error with trying to insert data to mongo' + err);
            });
        });

        await Promise.allSettled(requests).catch((err) => {
            console.error('Error while processing requests' + err);
        });
    } catch (error) {
        console.error('Error occurred addBidReqMongo:' + error);
    }
}

async function insertBidResponseIntoMongo(dataJson, dspId, postDataStringJson, sspPartner, type, devicetype, bidRequest, server, sspTmax) {

    let deals = postDataStringJson.imp[0]?.pmp?.deal
    let pmpDeal = undefined

    if(postDataStringJson.imp[0]?.pmp?.deal && postDataStringJson.imp[0]?.pmp?.deal[0]) {
        pmpDeal = postDataStringJson.imp[0]?.pmp?.deal[0]
    }

    const bidResponseData = {
        p1: postDataStringJson.app?.bundle || postDataStringJson.site?.domain,
        p2: devicetype,
        p3: postDataStringJson.device?.os,
        p4: postDataStringJson.device?.geo?.country,
        p5: 'inapp', // TODO: fixme
        p6: Math.ceil(bidRequest.imp['0']?.bidfloor * 100) / 100,
        p7: type,
        p8: Math.ceil(sspTmax / 10) * 10,
        p9: `${postDataStringJson.imp['0']?.banner?.w || postDataStringJson.imp['0']?.w || postDataStringJson.imp['0']?.video?.w || ''}x${postDataStringJson.imp['0']?.banner?.h || postDataStringJson.imp['0']?.h || postDataStringJson.imp['0']?.video?.h ||''}`,
        p10: postDataStringJson.imp['0']?.video?.ext?.rewarded ? 1 : 0,
        p11: bidRequest.app?.publisher?.id || bidRequest.site?.publisher?.id,
        p12: sspPartner.id,
        p13: postDataStringJson.imp[0]?.pmp ? 1 : 0,
        p14: postDataStringJson.imp[0]?.pmp?.private_auction,
        p15: pmpDeal?.id,
        p16: isNaN(parseFloat(pmpDeal?.bidfloor)) ? undefined : Math.ceil(parseFloat(pmpDeal?.bidfloor) * 10) / 10,
        p17: postDataStringJson.imp[0]?.instl,
        p20: dspId,
        p21: dataJson.seatbid[0]?.bid[0]?.price ? Math.round(dataJson.seatbid[0]?.bid[0]?.price * 100) / 100 : undefined,
        p22: dataJson.seatbid[0]?.bid[0]?.crid,
        p23: dataJson.seatbid[0]?.bid[0]?.cid,
        p30: postDataStringJson.device?.model,
        p31: postDataStringJson.device?.osv,
        p32: postDataStringJson.device?.make,
        p33: postDataStringJson.device?.carrier,
        p34: Math.ceil(postDataStringJson.imp['0']?.bidfloor * 100) / 100,
        p35: postDataStringJson.device?.connectiontype,
        p36: postDataStringJson.device?.geo?.city,
        p37: postDataStringJson.device?.geo?.region,
        p38: postDataStringJson.app?.name || postDataStringJson.site?.name,
        p40: server,
        p41: postDataStringJson.app?.publisher?.id || postDataStringJson.site?.publisher?.id,
        p42: Math.ceil(postDataStringJson.tmax / 10) * 10,
    };

    const filteredBidResponseData = Object.fromEntries(
        Object.entries(bidResponseData).filter(([key, value]) => value !== undefined && value !== null)
    );

    if (Object.keys(filteredBidResponseData).length === 0) {
        console.log('No valid data to insert into MongoDB.');
        return;
    }

    const roundMinutes = Math.floor(moment().minutes() / 5) * 5;
    const event_time = moment().startOf('hour').minutes(roundMinutes).format('YYYY-MM-DD-HH-mm');

    const key = (
        filteredBidResponseData.p1 +
        del + filteredBidResponseData.p2 +
        del + filteredBidResponseData.p3 +
        del + filteredBidResponseData.p4 +
        del + filteredBidResponseData.p5 +
        del + filteredBidResponseData.p6 +
        del + filteredBidResponseData.p7 +
        del + filteredBidResponseData.p8 +
        del + filteredBidResponseData.p9 +
        del + filteredBidResponseData.p10 +
        del + filteredBidResponseData.p11 +
        del + filteredBidResponseData.p12 +
        del + filteredBidResponseData.p13 +
        del + filteredBidResponseData.p14 +
        del + filteredBidResponseData.p15 +
        del + filteredBidResponseData.p16 +
        del + filteredBidResponseData.p17 +
        del + filteredBidResponseData.p20 +
        del + filteredBidResponseData.p21 +
        del + filteredBidResponseData.p22 +
        del + filteredBidResponseData.p23 +
        del + filteredBidResponseData.p30 +
        del + filteredBidResponseData.p31 +
        del + filteredBidResponseData.p32 +
        del + filteredBidResponseData.p33 +
        del + filteredBidResponseData.p34 +
        del + filteredBidResponseData.p35 +
        del + filteredBidResponseData.p36 +
        del + filteredBidResponseData.p37 +
        del + filteredBidResponseData.p38 +
        del + filteredBidResponseData.p40 +
        del + filteredBidResponseData.p41 +
        del + filteredBidResponseData.p42 +
        del + event_time
    ).toString();

    if (responseData[key]?.length > 0) {
        responseData[key].push({
            ...filteredBidResponseData,
            event_time: event_time,
        });
    } else {
        responseData[key] = [
            {
                ...filteredBidResponseData,
                event_time: event_time,
            },
        ];
    }
}

async function addBidResMongo() {
    try {
        if (Object.keys(responseData).length === 0) return;

        const responseDataCopy = _.cloneDeep(responseData);

        clearResponseData();
        const aggregatedData = {};

        for (const key of Object.keys(responseDataCopy)) {
            const dataArray = responseDataCopy[key];
            for (const dataItem of dataArray) {
                const dataKey = JSON.stringify(dataItem);
                if (aggregatedData[dataKey]) {
                    aggregatedData[dataKey].count += 1;
                } else {
                    aggregatedData[dataKey] = {
                        ...dataItem,
                        count: 1,
                    };
                }
            }
        }

        const batchSize = 5000;
        const dataKeys = Object.keys(aggregatedData);
        const batches = [];

        for (let i = 0; i < dataKeys.length; i += batchSize) {
            const batchKeys = dataKeys.slice(i, i + batchSize);
            const batchItems = batchKeys.map(key => aggregatedData[key]);
            batches.push(batchItems);
        }
        const responses = batches.map(batch => {
            return globalServices.cached.bidResponses.insertMany(batch).catch(err => {
                console.error('Error with trying to insert data to mongo' + err);
            });
        });

        await Promise.allSettled(responses).catch((err) => {
            console.error('Error while processing responses' + err);
        });
    } catch (error) {
        console.error('Error occurred addBidResMongo:' + error);
    }
}

async function insertNurlIntoMongo(dataNurl, server) {

    let deals = dataNurl.request?.imp[0]?.pmp?.deal
    let pmpDeal = undefined

    if(dataNurl.request?.imp[0]?.pmp?.deal && dataNurl.request?.imp[0]?.pmp?.deal[0]) {
        pmpDeal = dataNurl.request?.imp[0]?.pmp?.deal[0]
    }

    const nurlData = {
        p1: dataNurl.request?.app?.bundle || dataNurl.request?.site?.domain,
        p2: dataNurl.devicetype,
        p3: dataNurl.request?.device?.os,
        p4: dataNurl.request?.device?.geo?.country,
        p5: 'inapp', // TODO: fixme
        p6: Math.ceil(dataNurl.request?.imp['0']?.bidfloor * 100) / 100,
        p7: dataNurl.type,
        p8: Math.ceil(dataNurl.sspTmax / 10) * 10,
        p9: `${dataNurl.request?.imp['0']?.banner?.w || dataNurl.request?.imp['0']?.w || dataNurl.request?.imp['0']?.video?.w || ''}x${dataNurl.request?.imp['0']?.banner?.h || dataNurl.request?.imp['0']?.h || dataNurl.request?.imp['0']?.video?.h || ''}`,
        p10: dataNurl.request?.imp['0']?.video?.ext?.rewarded ? 1 : 0,
        p11: dataNurl.request?.app?.publisher?.id || dataNurl.request?.site?.publisher?.id,
        p12: dataNurl.sspId,
        p13: dataNurl.request?.imp[0]?.pmp ? 1 : 0,
        p14: dataNurl.request?.imp[0]?.pmp?.private_auction,
        p15: pmpDeal?.id,
        p16: isNaN(parseFloat(pmpDeal?.bidfloor)) ? undefined : Math.ceil(parseFloat(pmpDeal?.bidfloor) * 10) / 10,
        p17: dataNurl.request?.imp[0]?.instl,
        p20: dataNurl.dspId,
        p21: dataNurl.response?.data?.seatbid[0]?.bid[0]?.price ? Math.round(dataNurl.response?.data?.seatbid[0]?.bid[0]?.price * 100) / 100 : undefined,
        p22: dataNurl.response?.data?.seatbid[0]?.bid[0]?.crid,
        p23: dataNurl.response?.data?.seatbid[0]?.bid[0]?.cid,
        p26: dataNurl.dspspend,
        p27: dataNurl.sspspend,
        p30: dataNurl.request?.device?.model,
        p31: dataNurl.request?.device?.osv,
        p32: dataNurl.request?.device?.make,
        p33: dataNurl.request?.device?.carrier,
        p34: Math.ceil(dataNurl.response?.bf * 100) / 100,
        p35: dataNurl.request?.device?.connectiontype,
        p36: dataNurl.request?.device?.geo?.city,
        p37: dataNurl.request?.device?.geo?.region,
        p38: dataNurl.request?.app?.name || dataNurl.request?.site?.name,
        p39: dataNurl.repackCrid,
        p40: server,
        p41: dataNurl.postDataString?.app?.publisher?.id || dataNurl.postDataString?.site?.publisher?.id,
        p42: Math.ceil(dataNurl.postDataString?.tmax / 10) * 10,
};

    const filteredNurlData = Object.fromEntries(
        Object.entries(nurlData).filter(([key, value]) => value !== undefined && value !== null)
    );

    if (Object.keys(filteredNurlData).length === 0) {
        console.log('No valid data to insert into MongoDB.');
        return;
    }

    const roundMinutes = Math.floor(moment().minutes() / 5) * 5;
    const event_time = moment().startOf('hour').minutes(roundMinutes).format('YYYY-MM-DD-HH-mm');

    const key = (
        filteredNurlData.p1 +
        del + filteredNurlData.p2 +
        del + filteredNurlData.p3 +
        del + filteredNurlData.p4 +
        del + filteredNurlData.p5 +
        del + filteredNurlData.p6 +
        del + filteredNurlData.p7 +
        del + filteredNurlData.p8 +
        del + filteredNurlData.p9 +
        del + filteredNurlData.p10 +
        del + filteredNurlData.p11 +
        del + filteredNurlData.p12 +
        del + filteredNurlData.p13 +
        del + filteredNurlData.p14 +
        del + filteredNurlData.p15 +
        del + filteredNurlData.p16 +
        del + filteredNurlData.p17 +
        del + filteredNurlData.p20 +
        del + filteredNurlData.p21 +
        del + filteredNurlData.p22 +
        del + filteredNurlData.p23 +
        del + filteredNurlData.p26 +
        del + filteredNurlData.p27 +
        del + filteredNurlData.p30 +
        del + filteredNurlData.p31 +
        del + filteredNurlData.p32 +
        del + filteredNurlData.p33 +
        del + filteredNurlData.p34 +
        del + filteredNurlData.p35 +
        del + filteredNurlData.p36 +
        del + filteredNurlData.p37 +
        del + filteredNurlData.p38 +
        del + filteredNurlData.p39 +
        del + filteredNurlData.p40 +
        del + filteredNurlData.p41 +
        del + filteredNurlData.p42 +
        del + event_time
    ).toString();

    if (nurlsData[key]?.length > 0) {
        nurlsData[key].push({
            ...filteredNurlData,
            event_time: event_time,
        });
    } else {
        nurlsData[key] = [
            {
                ...filteredNurlData,
                event_time: event_time,
            },
        ];
    }
}

async function addNurlMongo() {
    try {
        if (Object.keys(nurlsData).length === 0) return;

        const nurlDataCopy = _.cloneDeep(nurlsData);

        clearNurlData();
        const aggregatedData = {};

        for (const key of Object.keys(nurlDataCopy)) {
            const dataArray = nurlDataCopy[key];
            for (const dataItem of dataArray) {
                const dataKey = JSON.stringify(dataItem);
                if (aggregatedData[dataKey]) {
                    aggregatedData[dataKey].count += 1;
                } else {
                    aggregatedData[dataKey] = {
                        ...dataItem,
                        count: 1,
                    };
                }
            }
        }

        const batchSize = 5000;
        const dataKeys = Object.keys(aggregatedData);
        const batches = [];

        for (let i = 0; i < dataKeys.length; i += batchSize) {
            const batchKeys = dataKeys.slice(i, i + batchSize);
            const batchItems = batchKeys.map(key => aggregatedData[key]);
            batches.push(batchItems);
        }
        const nurls = batches.map(batch => {
            return globalServices.cached.nurls.insertMany(batch).catch(err => {
                console.error('Error with trying to insert data to mongo' + err);
            });
        });

        await Promise.allSettled(nurls).catch((err) => {
            console.error('Error while processing nurls' + err);
        });
    } catch (error) {
        console.error('Error occurred addNurlMongo:' + error);
    }
}

async function insertImprIntoMongo(dataImpr, server) {
    let deals = dataImpr.request?.imp[0]?.pmp?.deal
    let pmpDeal = undefined

    if(dataImpr.request?.imp[0]?.pmp?.deal && dataImpr.request?.imp[0]?.pmp?.deal[0]) {
        pmpDeal = dataImpr.request?.imp[0]?.pmp?.deal[0]
    }

    const imprData = {
        p1: dataImpr.request?.app?.bundle || dataImpr.request?.site?.domain,
        p2: dataImpr.devicetype,
        p3: dataImpr.request?.device?.os,
        p4: dataImpr.request?.device?.geo?.country,
        p5: 'inapp', // TODO: fixme
        p6: Math.ceil(dataImpr.request?.imp['0']?.bidfloor * 100) / 100,
        p7: dataImpr.type,
        p8: Math.ceil(dataImpr.sspTmax / 10) * 10,
        p9: `${dataImpr.request?.imp['0']?.banner?.w || dataImpr.request?.imp['0']?.w || dataImpr.request?.imp['0']?.video?.w || ''}x${dataImpr.request?.imp['0']?.banner?.h || dataImpr.request?.imp['0']?.h || dataImpr.request?.imp['0']?.video?.h || ''}`,
        p10: dataImpr.request?.imp['0']?.video?.ext?.rewarded ? 1 : 0,
        p11: dataImpr.request?.app?.publisher?.id || dataImpr.request?.site?.publisher?.id,
        p12: dataImpr.sspId,
        p13: dataImpr.request?.imp[0]?.pmp ? 1 : 0,
        p14: dataImpr.request?.imp[0]?.pmp?.private_auction,
        p15: pmpDeal?.id,
        p16: isNaN(parseFloat(pmpDeal?.bidfloor)) ? undefined : Math.ceil(parseFloat(pmpDeal?.bidfloor) * 10) / 10,
        p17: dataImpr.request?.imp[0]?.instl,
        p20: dataImpr.dspId,
        p21: dataImpr.response?.data?.seatbid[0]?.bid[0]?.price ? Math.round(dataImpr.response?.data?.seatbid[0]?.bid[0]?.price * 100) / 100 : undefined,
        p22: dataImpr.response?.data?.seatbid[0]?.bid[0]?.crid,
        p23: dataImpr.response?.data?.seatbid[0]?.bid[0]?.cid,
        p26: dataImpr.dspspend,
        p27: dataImpr.sspspend,
        p30: dataImpr.request?.device?.model,
        p31: dataImpr.request?.device?.osv,
        p32: dataImpr.request?.device?.make,
        p33: dataImpr.request?.device?.carrier,
        p34: Math.ceil(dataImpr.response?.bf * 100) / 100,
        p35: dataImpr.request?.device?.connectiontype,
        p36: dataImpr.request?.device?.geo?.city,
        p37: dataImpr.request?.device?.geo?.region,
        p38: dataImpr.request?.app?.name || dataImpr.request?.site?.name,
        p39: dataImpr.repackCrid,
        p40: server,
        p41: dataImpr.postDataString?.app?.publisher?.id || dataImpr.postDataString?.site?.publisher?.id,
        p42: Math.ceil(dataImpr.postDataString?.tmax / 10) * 10,
    };

    const filteredImprData = Object.fromEntries(
        Object.entries(imprData).filter(([key, value]) => value !== undefined && value !== null)
    );

    if (Object.keys(filteredImprData).length === 0) {
        console.log('No valid data to insert into MongoDB.');
        return;
    }

    const roundMinutes = Math.floor(moment().minutes() / 5) * 5;
    const event_time = moment().startOf('hour').minutes(roundMinutes).format('YYYY-MM-DD-HH-mm');

    const key = (
        filteredImprData.p1 +
        del + filteredImprData.p2 +
        del + filteredImprData.p3 +
        del + filteredImprData.p4 +
        del + filteredImprData.p5 +
        del + filteredImprData.p6 +
        del + filteredImprData.p7 +
        del + filteredImprData.p8 +
        del + filteredImprData.p9 +
        del + filteredImprData.p10 +
        del + filteredImprData.p11 +
        del + filteredImprData.p12 +
        del + filteredImprData.p13 +
        del + filteredImprData.p14 +
        del + filteredImprData.p15 +
        del + filteredImprData.p16 +
        del + filteredImprData.p17 +
        del + filteredImprData.p20 +
        del + filteredImprData.p21 +
        del + filteredImprData.p22 +
        del + filteredImprData.p23 +
        del + filteredImprData.p26 +
        del + filteredImprData.p27 +
        del + filteredImprData.p30 +
        del + filteredImprData.p31 +
        del + filteredImprData.p32 +
        del + filteredImprData.p33 +
        del + filteredImprData.p34 +
        del + filteredImprData.p35 +
        del + filteredImprData.p36 +
        del + filteredImprData.p37 +
        del + filteredImprData.p38 +
        del + filteredImprData.p39 +
        del + filteredImprData.p40 +
        del + filteredImprData.p41 +
        del + filteredImprData.p42 +
        del + event_time
    ).toString();

    if (imprsData[key]?.length > 0) {
        imprsData[key].push({
            ...filteredImprData,
            event_time: event_time,
        });
    } else {
        imprsData[key] = [
            {
                ...filteredImprData,
                event_time: event_time,
            },
        ];
    }
}

async function addImprMongo() {
    try {
        if (Object.keys(imprsData).length === 0) return;

        const imprDataCopy = _.cloneDeep(imprsData);

        clearImprData();
        const aggregatedData = {};

        for (const key of Object.keys(imprDataCopy)) {
            const dataArray = imprDataCopy[key];
            for (const dataItem of dataArray) {
                const dataKey = JSON.stringify(dataItem);
                if (aggregatedData[dataKey]) {
                    aggregatedData[dataKey].count += 1;
                } else {
                    aggregatedData[dataKey] = {
                        ...dataItem,
                        count: 1,
                    };
                }
            }
        }

        const batchSize = 5000;
        const dataKeys = Object.keys(aggregatedData);
        const batches = [];

        for (let i = 0; i < dataKeys.length; i += batchSize) {
            const batchKeys = dataKeys.slice(i, i + batchSize);
            const batchItems = batchKeys.map(key => aggregatedData[key]);
            batches.push(batchItems);
        }
        const imprs = batches.map(batch => {
            return globalServices.cached.impressions1.insertMany(batch).catch(err => {
                console.error('Error with trying to insert data to mongo' + err);
            });
        });

        await Promise.allSettled(imprs).catch((err) => {
            console.error('Error while processing impressions' + err);
        });
    } catch (error) {
        console.error('Error occurred addImprMongo:' + error);
    }
}

async function insertOurBidRequestIntoMongo(ourBidRequest, sspPartner, type, devicetype, dspId, bidRequest, server, sspTmax) {
    let deals = ourBidRequest.imp[0]?.pmp?.deal
    let pmpDeal = undefined

    if(ourBidRequest.imp[0]?.pmp?.deal && ourBidRequest.imp[0]?.pmp?.deal[0]) {
        pmpDeal = ourBidRequest.imp[0]?.pmp?.deal[0]
    }

    const ourBidRequestData = {
        p1: ourBidRequest.app?.bundle || ourBidRequest.site?.domain,
        p2: devicetype,
        p3: ourBidRequest.device?.os,
        p4: ourBidRequest.device?.geo?.country,
        p5: 'inapp', // TODO: fixme
        p6: Math.ceil(bidRequest.imp['0']?.bidfloor * 100) / 100,
        p7: type,
        p8: Math.ceil(sspTmax / 10) * 10,
        p9: `${ourBidRequest.imp['0']?.banner?.w || ourBidRequest.imp['0']?.w || ourBidRequest.imp['0']?.video?.w || ''}x${ourBidRequest.imp['0']?.banner?.h || ourBidRequest.imp['0']?.h || ourBidRequest.imp['0']?.video?.h ||''}`,
        p10: ourBidRequest.imp['0']?.video?.ext?.rewarded ? 1 : 0,
        p11: bidRequest.app?.publisher?.id || bidRequest.site?.publisher?.id,
        p12: sspPartner.id,
        p13: ourBidRequest.imp[0]?.pmp ? 1 : 0,
        p14: ourBidRequest.imp[0]?.pmp?.private_auction,
        p15: pmpDeal?.id,
        p16: isNaN(parseFloat(pmpDeal?.bidfloor)) ? undefined : Math.ceil(parseFloat(pmpDeal?.bidfloor) * 10) / 10,
        p17: ourBidRequest.imp[0]?.instl,
        p20: dspId,
        p30: ourBidRequest.device?.model,
        p31: ourBidRequest.device?.osv,
        p32: ourBidRequest.device?.make,
        p33: ourBidRequest.device?.carrier,
        p34: Math.ceil(ourBidRequest.imp['0']?.bidfloor * 100) / 100,
        p35: ourBidRequest.device?.connectiontype,
        p36: ourBidRequest.device?.geo?.city,
        p37: ourBidRequest.device?.geo?.region,
        p38: ourBidRequest.app?.name || ourBidRequest.site?.name,
        p40: server,
        p41: ourBidRequest.app?.publisher?.id || ourBidRequest.site?.publisher?.id,
        p42: Math.ceil(ourBidRequest.tmax / 10) * 10,
    };

    const filteredOurBidRequestData = Object.fromEntries(
        Object.entries(ourBidRequestData).filter(([key, value]) => value !== undefined && value !== null)
    );

    if (Object.keys(filteredOurBidRequestData).length === 0) {
        console.log('No valid data to insert into MongoDB.');
        return;
    }

    const roundMinutes = Math.floor(moment().minutes() / 5) * 5;
    const event_time = moment().startOf('hour').minutes(roundMinutes).format('YYYY-MM-DD-HH-mm');

    const key = (
        filteredOurBidRequestData.p1 +
        del + filteredOurBidRequestData.p2 +
        del + filteredOurBidRequestData.p3 +
        del + filteredOurBidRequestData.p4 +
        del + filteredOurBidRequestData.p5 +
        del + filteredOurBidRequestData.p6 +
        del + filteredOurBidRequestData.p7 +
        del + filteredOurBidRequestData.p8 +
        del + filteredOurBidRequestData.p9 +
        del + filteredOurBidRequestData.p10 +
        del + filteredOurBidRequestData.p11 +
        del + filteredOurBidRequestData.p12 +
        del + filteredOurBidRequestData.p13 +
        del + filteredOurBidRequestData.p14 +
        del + filteredOurBidRequestData.p15 +
        del + filteredOurBidRequestData.p16 +
        del + filteredOurBidRequestData.p17 +
        del + filteredOurBidRequestData.p20 +
        del + filteredOurBidRequestData.p30 +
        del + filteredOurBidRequestData.p31 +
        del + filteredOurBidRequestData.p32 +
        del + filteredOurBidRequestData.p33 +
        del + filteredOurBidRequestData.p34 +
        del + filteredOurBidRequestData.p35 +
        del + filteredOurBidRequestData.p36 +
        del + filteredOurBidRequestData.p37 +
        del + filteredOurBidRequestData.p38 +
        del + filteredOurBidRequestData.p40 +
        del + filteredOurBidRequestData.p41 +
        del + filteredOurBidRequestData.p42 +
        del + event_time
    ).toString();

    if (ourRequestData[key]?.length > 0) {
        ourRequestData[key].push({
            ...filteredOurBidRequestData,
            event_time: event_time,
        });
    } else {
        ourRequestData[key] = [{
            ...filteredOurBidRequestData,
            event_time: event_time,
        }];
    }
}


let counterOfAddingOurBidRequests = 0
async function addOurBidReqMongo() {
    counterOfAddingOurBidRequests++
    let startAddOurBidReqMongo = new Date()
    console.log(`ITERATION: ${counterOfAddingOurBidRequests} starts at: ${startAddOurBidReqMongo.toISOString()}`)
    try {
        if (Object.keys(ourRequestData).length === 0) return;

        const ourRequestDataCopy = _.cloneDeep(ourRequestData);

        clearOurRequestsDataExch();
        const aggregatedData = {};

        for (const key of Object.keys(ourRequestDataCopy)) {
            const dataArray = ourRequestDataCopy[key];
            for (const dataItem of dataArray) {
                const dataKey = JSON.stringify(dataItem);
                if (aggregatedData[dataKey]) {
                    aggregatedData[dataKey].count += 1;
                } else {
                    aggregatedData[dataKey] = {
                        ...dataItem,
                        count: 1,
                    };
                }
            }
        }

        const batchSize = 5000;
        const dataKeys = Object.keys(aggregatedData);
        const batches = [];

        for (let i = 0; i < dataKeys.length; i += batchSize) {
            const batchKeys = dataKeys.slice(i, i + batchSize);
            const batchItems = batchKeys.map(key => aggregatedData[key]);
            batches.push(batchItems);
        }

        const ourRequests = batches.map(batch => {
            return globalServices.cached.ourBidRequests.insertMany(batch).catch(err => {
                console.error('Error with trying to insert data to mongo' + err);
            });
        });


        let startMongoInsert = new Date()

        await Promise.allSettled(ourRequests).catch((err) => {
            console.error('Error while processing ourRequests' + err);
        });


        console.log(`Mongo Insert takes: ${new Date() - startMongoInsert}ms for ${dataKeys.length} elements`);
        let endAddOurBidReqMongo = new Date()
        console.log(`ITERATION: ${counterOfAddingOurBidRequests} end at: ${endAddOurBidReqMongo.toISOString()}`)

    } catch (error) {
        console.error('Error occurred addOurBidReqMongo:' + error);
    }
}

async function insertBurlIntoMongo(dataBurl, server) {

    let deals = dataBurl.request?.imp[0]?.pmp?.deal
    let pmpDeal = undefined

    if(dataBurl.request?.imp[0]?.pmp?.deal && dataBurl.request?.imp[0]?.pmp?.deal[0]) {
        pmpDeal = dataBurl.request?.imp[0]?.pmp?.deal[0]
    }

    const burlData = {
        p1: dataBurl.request?.app?.bundle || dataBurl.request?.site?.domain,
        p2: dataBurl.devicetype,
        p3: dataBurl.request?.device?.os,
        p4: dataBurl.request?.device?.geo?.country,
        p5: 'inapp', // TODO: fixme
        p6: Math.ceil(dataBurl.request?.imp['0']?.bidfloor * 100) / 100,
        p7: dataBurl.type,
        p8: Math.ceil(dataBurl.sspTmax / 10) * 10,
        p9: `${dataBurl.request?.imp['0']?.banner?.w || dataBurl.request?.imp['0']?.w || dataBurl.request?.imp['0']?.video?.w || ''}x${dataBurl.request?.imp['0']?.banner?.h || dataBurl.request?.imp['0']?.h || dataBurl.request?.imp['0']?.video?.h || ''}`,
        p10: dataBurl.request?.imp['0']?.video?.ext?.rewarded ? 1 : 0,
        p11: dataBurl.request?.app?.publisher?.id || dataBurl.request?.site?.publisher?.id,
        p12: dataBurl.sspId,
        p13: dataBurl.request?.imp[0]?.pmp ? 1 : 0,
        p14: dataBurl.request?.imp[0]?.pmp?.private_auction,
        p15: pmpDeal?.id,
        p16: isNaN(parseFloat(pmpDeal?.bidfloor)) ? undefined : Math.ceil(parseFloat(pmpDeal?.bidfloor) * 10) / 10,
        p17: dataBurl.request?.imp[0]?.instl,
        p20: dataBurl.dspId,
        p21: dataBurl.response?.data?.seatbid[0]?.bid[0]?.price ? Math.round(dataBurl.response?.data?.seatbid[0]?.bid[0]?.price * 100) / 100 : undefined,
        p22: dataBurl.response?.data?.seatbid[0]?.bid[0]?.crid,
        p23: dataBurl.response?.data?.seatbid[0]?.bid[0]?.cid,
        p26: dataBurl.dspspend,
        p27: dataBurl.sspspend,
        p30: dataBurl.request?.device?.model,
        p31: dataBurl.request?.device?.osv,
        p32: dataBurl.request?.device?.make,
        p33: dataBurl.request?.device?.carrier,
        p34: Math.ceil(dataBurl.response?.bf * 100) / 100,
        p35: dataBurl.request?.device?.connectiontype,
        p36: dataBurl.request?.device?.geo?.city,
        p37: dataBurl.request?.device?.geo?.region,
        p38: dataBurl.request?.app?.name || dataBurl.request?.site?.name,
        p39: dataBurl.repackCrid,
        p40: server,
        p41: dataBurl.postDataString?.app?.publisher?.id || dataBurl.postDataString?.site?.publisher?.id,
        p42: Math.ceil(dataBurl.postDataString?.tmax / 10) * 10,
        p43: dataBurl.burl,
    };

    const filteredBurlData = Object.fromEntries(
        Object.entries(burlData).filter(([key, value]) => value !== undefined && value !== null)
    );

    if (Object.keys(filteredBurlData).length === 0) {
        console.log('No valid data to insert into MongoDB.');
        return;
    }

    const roundMinutes = Math.floor(moment().minutes() / 5) * 5;
    const event_time = moment().startOf('hour').minutes(roundMinutes).format('YYYY-MM-DD-HH-mm');

    const key = (
        filteredBurlData.p1 +
        del + filteredBurlData.p2 +
        del + filteredBurlData.p3 +
        del + filteredBurlData.p4 +
        del + filteredBurlData.p5 +
        del + filteredBurlData.p6 +
        del + filteredBurlData.p7 +
        del + filteredBurlData.p8 +
        del + filteredBurlData.p9 +
        del + filteredBurlData.p10 +
        del + filteredBurlData.p11 +
        del + filteredBurlData.p12 +
        del + filteredBurlData.p13 +
        del + filteredBurlData.p14 +
        del + filteredBurlData.p15 +
        del + filteredBurlData.p16 +
        del + filteredBurlData.p17 +
        del + filteredBurlData.p20 +
        del + filteredBurlData.p21 +
        del + filteredBurlData.p22 +
        del + filteredBurlData.p23 +
        del + filteredBurlData.p26 +
        del + filteredBurlData.p27 +
        del + filteredBurlData.p30 +
        del + filteredBurlData.p31 +
        del + filteredBurlData.p32 +
        del + filteredBurlData.p33 +
        del + filteredBurlData.p34 +
        del + filteredBurlData.p35 +
        del + filteredBurlData.p36 +
        del + filteredBurlData.p37 +
        del + filteredBurlData.p38 +
        del + filteredBurlData.p39 +
        del + filteredBurlData.p40 +
        del + filteredBurlData.p41 +
        del + filteredBurlData.p42 +
        del + filteredBurlData.p43 +
        del + event_time
    ).toString();

    if (burlsData[key]?.length > 0) {
        burlsData[key].push({
            ...filteredBurlData,
            event_time: event_time,
        });
    } else {
        burlsData[key] = [
            {
                ...filteredBurlData,
                event_time: event_time,
            },
        ];
    }
}

async function addBurlMongo() {
    try {
        if (Object.keys(burlsData).length === 0) return;

        const burlDataCopy = _.cloneDeep(burlsData);

        clearBurlData();
        const aggregatedData = {};

        for (const key of Object.keys(burlDataCopy)) {
            const dataArray = burlDataCopy[key];
            for (const dataItem of dataArray) {
                const dataKey = JSON.stringify(dataItem);
                if (aggregatedData[dataKey]) {
                    aggregatedData[dataKey].count += 1;
                } else {
                    aggregatedData[dataKey] = {
                        ...dataItem,
                        count: 1,
                    };
                }
            }
        }

        const batchSize = 5000;
        const dataKeys = Object.keys(aggregatedData);
        const batches = [];

        for (let i = 0; i < dataKeys.length; i += batchSize) {
            const batchKeys = dataKeys.slice(i, i + batchSize);
            const batchItems = batchKeys.map(key => aggregatedData[key]);
            batches.push(batchItems);
        }
        const burls = batches.map(batch => {
            return globalServices.cached.burls.insertMany(batch).catch(err => {
                console.error('Error with trying to insert data to mongo' + err);
            });
        });

        await Promise.allSettled(burls).catch((err) => {
            console.error('Error while processing burls' + err);
        });
    } catch (error) {
        console.error('Error occurred addBurlMongo:' + error);
    }
}


const clearRequestsDataExch = () => {
    requestData = {};
};

const clearResponseData = () => {
    responseData = {};
};

const clearNurlData = () => {
    nurlsData = {};
};

const clearImprData = () => {
    imprsData = {};
};

const clearOurRequestsDataExch = () => {
    ourRequestData = {};
};

const clearBurlData = () => {
    burlsData = {};
};

module.exports = {
    addBidReqMongo,
    insertBidRequestIntoMongo,
    addBidResMongo,
    insertBidResponseIntoMongo,
    insertNurlIntoMongo,
    addNurlMongo,
    insertImprIntoMongo,
    addImprMongo,
    addOurBidReqMongo,
    insertOurBidRequestIntoMongo,
    insertBurlIntoMongo,
    addBurlMongo,
};
