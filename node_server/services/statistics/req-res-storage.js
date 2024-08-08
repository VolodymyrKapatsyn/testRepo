/*
* Example of data, that will be saved to the memory:
*
* EVENTS: {
*    'bidRequest': {
*       '123': [<json>, ...],
*        ...
*    },
*    'bidResponse': {
*        '450': [<json>, ...],
*        ...
*    },
*    'ownBidRequest': {
*        '450': [<json>, ...],
*        ...
*    },
*    'ownBidResponse': {
*        '123': [<json>, ...],
*        ...
*    },
*};
* */

const DATA_TYPES = {
    'request': 'request',
    'response': 'response',
};

const EVENT_TYPES = {
    'bidRequest': 'bidRequest',
    'bidResponse': 'bidResponse',
    'ownBidRequest': 'ownBidRequest',
    'ownBidResponse': 'ownBidResponse',
};
const EVENT_TYPES_ARRAY = Object.values(EVENT_TYPES);

const DATA_AND_EVENT_MATCHES = {
    [DATA_TYPES['request']]: [EVENT_TYPES['bidRequest'], EVENT_TYPES['ownBidRequest']],
    [DATA_TYPES['response']]: [EVENT_TYPES['bidResponse'], EVENT_TYPES['ownBidResponse']],
};

class ReqResStorage {
    constructor(isEnabled) {
        this._storage = this._getNewStorage();
        this._isEnabled = isEnabled;
        this._saveInterval = 5 * 60 * 1000;
    }

    _logError (message) {
        console.error(`ReqResStorage error: ${message}`);
    }

    _getNewStorage() {
        return {
            [EVENT_TYPES['bidRequest']]: {},
            [EVENT_TYPES['bidResponse']]: {},
            [EVENT_TYPES['ownBidRequest']]: {},
            [EVENT_TYPES['ownBidResponse']]: {},
        };
    }

    _getUnitDataInDBFormat(storage, eventType, id, createdAt) {
        id = parseInt(id);
        if (!id) {
            this._logError(`invalid ssp|dsp id`);
            return false;
        }
        if (!storage[eventType][id] || !storage[eventType][id].length) {
            this._logError(`empty storage for dsp ${id}`);
            return false;
        }

        const result = {
            'data': storage[eventType][id],
            'createdAt': createdAt,
        };

        if (
            eventType === EVENT_TYPES['bidRequest'] ||
            eventType === EVENT_TYPES['ownBidResponse']
        ) result['sspId'] = id;
        else result['dspId'] = id;

        return result;
    }

    async _storeDataToDB(collName, dataType, storage) {
        const now = new Date();
        const matches = DATA_AND_EVENT_MATCHES[dataType];
        const data = [];

        matches.forEach((eventType) => {
            Object.keys(storage[eventType]).forEach((key) => {
                const dbUnit = this._getUnitDataInDBFormat(storage, eventType, key, now);
                if (dbUnit) data.push(dbUnit);
            });
        });

        await this._db.collection(collName).deleteMany({
            'id': {
                '$in': data.map((r) => r['id']),
            },
        });

        if (!data.length) return;

        await this._db.collection(collName).insertMany(data);
    }

    async _transferToDB() {
        if (!this._isEnabled) return;

        if (!this._client || !this._db) {
            console.error('ReqResStorage trying to save events, but no db registered!')
            return;
        }

        const _storage = this._storage;
        this._storage = this._getNewStorage();

        await this._storeDataToDB('requestExamples', DATA_TYPES['request'], _storage);
        await this._storeDataToDB('responseExamples', DATA_TYPES['response'], _storage);
    }

    init(client, db) {
        this._client = client;
        this._db = db;

        if (this._isEnabled) {
            setInterval(() => {
                this._transferToDB().catch((error) => console.error(error));
            }, this._saveInterval);
        }
    }

    save(type, id, data) {
        if (!this._isEnabled) return;

        if (!EVENT_TYPES_ARRAY.includes(type)) {
            throw new Error(`Unknown event type: ${type}`);
        }

        if (!this._storage[type][id]) this._storage[type][id] = [];
        if (this._storage[type][id].length < 5) {
            this._storage[type][id].push(typeof data === 'string' && data || JSON.stringify(data));
        }
    };
}

module.exports = ReqResStorage;
