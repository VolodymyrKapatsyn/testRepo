const zlib = require('zlib');
const AbstractStatistic = require('./abstract-statistic')

class DspInfoService extends AbstractStatistic {
    constructor(isWriteExamples) {
        super('dspInfoStats',5);
        this._isEnabled = true;
        this._isWriteExamples = !!isWriteExamples;
        this._isInitialized = false;
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
            'ssp_connector_mismatch': true,
            'ssp_blocked_adomain': true,
            'ssp_blocked_crid': true,
            'ssp_blocked_adm_domain': true,
            'request_error': true,
            'no_blocked_tmt_domains': true,
            'invalid_assets': true,
            'invalid_eventtrackers': true,
            'unknown_asset_type': true,
            'invalid_video_asset': true,
            'invalid_data_asset': true,
            'invalid_img_asset': true,
            'invalid_title_asset': true,
            'invalid_asset_id': true,
            'invalid_version': true,
            'invalid_link_url': true,
            'invalid_adm': true,
            'adm_parse_error': true,
            'assets_downgrade_unavailable': true,
            'eventtrackers_downgrade_unavailable': true,
            'audio': true,
            'absent_assets': true,
            'invalid_assets_ids': true,
            'unacceptable_response': false,
        };
        this._extraActions = {
            'no_bid': this._addNoBid,
            'ssp_connector_mismatch': this._addExtraCounter,
            'ssp_blocked_adomain': this._addExtraCounter,
            'ssp_blocked_crid': this._addExtraCounter,
            'ssp_blocked_adm_domain': this._addExtraCounter,
            'tmt_blocked_adm_domains': this._addExtraCounter,
            'tmt_blocked_crid': this._addExtraCounter,
        };
    }

    _prepareEntry(dspId) {
        this._data[dspId] || (this._data[dspId] = {
            'requests': 0,
            'responses': 0,
            'validResponses': 0,
            'timeouts': 0,
            'errors': 0,
            'invalidBidReasons': {},
            'statusCodes': {},
            'blockeds': {},
            'examples': {}
        });
    }

    /**
     * @param  {number} dspId
     * @param  {string} event - it could be error or event name
     * @param  {object} data - includes response and request JSON's and some extra data
     */
    addReason(dspId, reason, data) {
        if (!this._isInitialized) return;
        this._prepareEntry(dspId);
        this._data[dspId]['invalidBidReasons'][reason] = (this._data[dspId]['invalidBidReasons'][reason] += 1) || 1;
        this._addExample(dspId, reason, data);
        if (this._extraActions[reason]) this._extraActions[reason].call(this, dspId, reason, data);

    }

    /**
     * @param  {number} dspId
     * @param  {string} event - it could be error or event name
     * @param  {object} data - includes response and request JSON's and some extra data
     */
    addEvent(dspId, event, data) {
        if (!this._isInitialized) return;
        this._prepareEntry(dspId);
        this._data[dspId][event]++;
    }

    _isWriteExample(reason) {
        return this._isWriteExamples && this._errorTypes[reason];
    }

    async _addExample(dspId, reason, data) {
        if (!this._isWriteExample(reason)) return;
        if (data.requestJSON != undefined && data.responseJSON != undefined) {
            let examples = this._data[dspId]['examples'][reason];
            examples = examples || [];
            if (examples.length < 3) {
                let example = {};
                example.request = await this._toDeflate(data.requestJSON);
                example.response = await this._toDeflate(data.responseJSON);
                examples.push(example);
                if(!this._data[dspId]) this._prepareEntry(dspId); // fix for large examples that take too long to compress
                this._data[dspId]['examples'][reason] = examples;
            }
        }
    }
    _addExtraCounter(dspId, event, data) {
        const extraFieldNames = {
            'ssp_blocked_adomain': 'adomain',
            'ssp_blocked_crid': 'crid',
            'tmt_blocked_adm_domains':'tmtBlockedAdmDomains',
            'tmt_blocked_crid':'tmtBlockedCrid'
        }
        const sspId = data.sspId;
        const extraCounter =  (event in extraFieldNames) ? data[extraFieldNames[event]].replace(/\./g,',') : 'counter';
        let blockeds = this._data[dspId]['blockeds'][event];
        blockeds = blockeds || {};
        blockeds[sspId] = blockeds[sspId] || {};
        blockeds[sspId][extraCounter] =  blockeds[sspId][extraCounter] || 0;
        blockeds[sspId][extraCounter] +=1;
        this._data[dspId]['blockeds'][event] = blockeds;
    }

    _addNoBid(dspId, event, data) {
        this._data[dspId]['statusCodes'][data.statusCode] = (this._data[dspId]['statusCodes'][data.statusCode] += 1) || 1;
    }

    storeResults() {
        if (!this._isInitialized) return;
        this._collection.insertOne(this._data)
            .then(() => {
                this._data = {};
            })
            .catch(err => {
                console.error('Error insert to mongodb (DspInfoService._storeStats()):', err);
            })
    }

    _toDeflate(dataString) {
        return new Promise((resolve, reject) => {
            zlib.deflate(dataString, (err, encodedData) => {
                if (err) return reject(err)
                resolve(encodedData.toString('base64'));
            })
        })
    }
}

module.exports = DspInfoService;
