const AbstractStatistic = require('./abstract-statistic')
const zlib = require('zlib');

const errorsList = {
    EMPTY_ID: 'empty_id',
    EMPTY_DEVICE: 'empty_device',
    EMPTY_DEVICE_UA: 'empty_device_ua',
    EMPTY_IMP: 'empty_imp',
    EMPTY_IMP_0: 'empty_imp_zero',
    INVALID_IMP_0_SECURE: 'invalid_imp_zero_secure',
    EMPTY_DEVICE_IP: 'empty_device_ip',
    UNKOWN_REQUEST_TYPE: 'unkown_request_type',
    EMPTY_IMP_0_NATIVE_REQUEST: 'empty_imp_zero_native_request',
    EMPTY_IMP_0_BANNER_SIZE: 'empty_imp_zero_banner_size',
    UNKOWN_PLATFORM_TYPE: 'unkown_platform_type',
    EMPTY_APP_BUNDLE: 'empty_app_bundle',
    EMPTY_SITE_DOMAIN: 'empty_site_domain',
    PARSE_ERROR: 'parse_error'
}

class SspMinRequirementsStatsService extends AbstractStatistic {

    constructor() {
        super();
        this.errorsList = errorsList;
        this._collectionExamples;
        this._collection;
        this._examples = {};
        this._itemList = Object.values(this.errorsList);
    }

    async init(mongo) {
        if (!this._isEnabled) return;
        try {
            this._collection = await this.createCollection(mongo, 'sspMinRequirementsStats');
            this._collectionExamples = await this.createCollection(mongo, 'sspMinRequirementsExamples');
            this._isInitialized = true;
            setInterval(() => {
                this.storeResults();
                this.storeExamples();
            }, 10 * 60 * 1000);
        } catch (ex) {
            console.error('Cannot create collection sspMinRequirementsStats or sspMinRequirementsExamples');
            console.error(ex);
        }
    }


    storeExamples() {
        if (!this._isInitialized) return;
        const updates = this._examples;
        this._examples = {};
        this._collectionExamples.bulkWrite(Object.keys(updates).map((key) => {
            return {
                insertOne: {
                    "document":
                        {
                            "_id": key, "data": updates[key]
                        }
                }
            }
        }), {ordered: false}).then((result) => {
        }).catch(err => {});
    }

    createCollection(mongo, name) {
        return new Promise((resolve, reject) => {
            mongo.collection(name, {}, (err, coll) => {
                if (coll === undefined) return reject(err);
                resolve(coll);
            });
        });
    }


    async detectedError(ssp, error, bidRequestJSON) {
        if (!this._isEnabled) return;
        this.createOrIncrement(ssp, error);
        if (this._data[ssp][error] <= 3) {
            try {
                this._examples[`${ssp}|${error}|${this._data[ssp][error]}`] = await this._toDeflate(bidRequestJSON);
            } catch (dontCare) {
            }
        }
    }

    _toDeflate(dataString) {
        return new Promise((resolve, reject) => {
            zlib.deflate(dataString, (err, encodedData) => {
                if (err) return reject(err)
                resolve(encodedData.toString('base64'));
            });
        });
    }
}

module.exports = SspMinRequirementsStatsService;
