const zlib = require('zlib');

class DspHourlyStatsService {
    constructor(isActive) {
        this._isActiveExamples = !!isActive;
        this._isInitialized = false;
        this._collectionExamples = null;
        this._collectionBlockeds = null;
        this._collectionStatusCodes = null;
        this._examples = {};
        this._blockeds = {};
        this._codes = {};
        this._errorTypes = {
            'bad_price': true,
            'bad_currency': true,
            'blocked_adv_domain': true,
            'parse_bid_error': true,
            'no_price_or_adm': true,
            'broken_crid': true,
            'tmt_no_checked_crid': true,
            'tmt_blocked_adm_domains': true,
            'tmt_blocked_crid': true,
            'tmt_empty_crid': true,
            'mismatch_assets': true,
            'no_bid':false,
            'bid_requests':false,
            'bid_responses':false,
            'valid_bid_responses':false,
            'adm_contain_our_tracker':true,
            'errors': false,
            'timeouts': false
        }
    }

    async init(mongo) {
        try{
            this._isActiveExamples && (this._collectionExamples = await this._createCollection(mongo, 'dspHourlyStatsExamples'));
            this._collectionBlockeds = await this._createCollection(mongo, 'dspHourlyStatsBlockeds');
            this._collectionStatusCodes = await this._createCollection(mongo, 'dspHourlyStatsStatusCodes');
            this._isInitialized = true;
            this._storing();
        }
        catch(ex) {
            console.error('Cannot create collections: ');
            console.error(ex);
        }
    }

    push(dspId, errorName, data) {
        if(!this._isInitialized) return;
        this._addBlocked(dspId, errorName, data);
        this._isWriteExample(errorName) && this._addExample(dspId, errorName, data);
    }

    _isWriteExample(errorName) {
        return this._isActiveExamples && this._errorTypes[errorName];
    }

    async _addExample(dspId, errorName, data) {
        const key = `${dspId}|${errorName}`;
        if(data.requestJSON != undefined && data.responseJSON != undefined) {
            for(let i = 1; i<=3; i++){
                if(!this._examples[`${key}|${i}`]){
                    this._examples[`${key}|${i}`] = {};
                    try{
                        this._examples[`${key}|${i}`].request = await this._toDeflate(data.requestJSON);
                        this._examples[`${key}|${i}`].response = await this._toDeflate(data.responseJSON);
                    }
                    catch(dontCare) {}
                    break;
                }
            }
        }
    }

    _addBlockedAdmDomain(key, blockedAdmDomains) {
        if(this._blockeds[key] == undefined) {
            this._blockeds[key] = [];
        }
        if(this._blockeds[key].indexOf(blockedAdmDomains) == -1) {
            this._blockeds[key].push(blockedAdmDomains);
        }
    }

    _addBlockedCrid(key, blockedCrid) {
        if(this._blockeds[key] == undefined) {
            this._blockeds[key] = [];
        }
        if(this._blockeds[key].indexOf(blockedCrid) == -1) {
            this._blockeds[key].push(blockedCrid);
        }
    }

    _addNoBid(key, statusCode) {
        this._codes[key] == undefined && (this._codes[key] = {});
        this._codes[key][statusCode] == undefined && (this._codes[key][statusCode] = 0);
        this._codes[key][statusCode]++;
    }

    _addBlocked(dspId, errorName, data) {
        if(errorName == 'tmt_blocked_adm_domains' && data.tmtBlockedAdmDomains != undefined)
            this._addBlockedAdmDomain(`${dspId}|${errorName}`, data.tmtBlockedAdmDomains);
        if(errorName == 'tmt_blocked_crid' && data.tmtBlockedCrid != undefined)
            this._addBlockedCrid(`${dspId}|${errorName}`, data.tmtBlockedCrid);
        if(errorName == 'no_bid')
            this._addNoBid(`${dspId}`, data.statusCode)
        if(errorName == 'ssp_blocked_crid' && data.sspBlockedCrid)
            this._addBlockedCrid(`${dspId}|${errorName}`, data.sspBlockedCrid);
    }

    _storing() {
        setInterval(()=>{
            this._collectionExamples && this._storeExamples();
            this._collectionBlockeds && this._storeBlockeds();
            this._collectionStatusCodes && this._storeStatusCodes();
        }, 1000*60*10);
    }

    _storeExamples() {
        if(!this._isInitialized) return;
        const updates = this._examples;
        this._examples = {};
        this._collectionExamples.bulkWrite(
           Object.keys(updates).map((key)=>{
               return {
                   insertOne: {
                       "document" :
                       {
                          "_id" : key, "data" : updates[key]
                       }
                   }
               }
           }),
            { ordered : false }
        )
        .then((result)=>{}).catch(err=>{});
    }

    _storeBlockeds() {
        if(!this._isInitialized) return;
        const updates = this._blockeds;
        this._blockeds = {};
        this._collectionBlockeds.bulkWrite(
           Object.keys(updates).map((key)=>{
               return {
                   updateOne : {
                       "filter" : {
                          "_id" : key
                       },
                       "update" : {
                           $addToSet : {
                               "data" : {
                                   $each: updates[key]
                               }
                           }
                       },
                       "upsert" : true
                   }
               }
           }),
            { ordered : false }
        )
        .then((result)=>{}).catch(err=>{});
    }

    _storeStatusCodes() {
        if(!this._isInitialized) return;
        const updates = this._codes;
        this._codes = {};
        this._collectionStatusCodes.bulkWrite(
           Object.keys(updates).map((key)=>{
               return {
                   updateOne : {
                       "filter" : {
                          "_id" : key
                       },
                       "update" : {
                            $inc: this._toIncrementObject(updates[key])
                       },
                       "upsert" : true
                   }
               }
           }),
            { ordered : false }
        )
        .then((result)=>{}).catch(err=>{});
    }

    _toIncrementObject(data) {
        const incrementObject = {}
        for(let item in data) incrementObject[`data.${item}`] = data[item];
        return incrementObject;
    }

    _createCollection(mongo, name) {
        return new Promise((resolve, reject)=>{
            mongo.collection(name, {}, (err, coll) => {
                if(coll === undefined) return reject(err);
                resolve(coll);
            });
        });
    }

    _toDeflate(dataString) {
        return new Promise((resolve, reject)=>{
            zlib.deflate(dataString, (err, encodedData)=>{
                if(err) return reject(err)
                resolve(encodedData.toString('base64'));
            })
        })
    }
}

module.exports = DspHourlyStatsService;
