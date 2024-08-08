const config = require('../../configs/config.json');

class AbstractStatistic {
    constructor(name = "", updateTime = 10) {
        this._isInitialized = false;
        this._isEnabled = config.useRequestStats;
        this._collection = null;
        this._data = {};
        this._name = name;
        this._updateTime = updateTime;
        this._itemList = [];
    }

    get itemList() {
        return this._itemList;
    }

    init(mongo) {
        if(!this._isEnabled) return;
        mongo.collection(this._name, {}, (err, coll) => {
            if(coll === undefined) return;
            (this._collection = coll) && (this._isInitialized = true);
            setInterval(()=>this.storeResults(), this._updateTime*60*1000);
        });
    }

    createOrIncrement(key,name) {
        if(!this._isEnabled) return;
        if(!this._data[key]) {
            this._data[key] = {};
            for(let item of this.itemList) {
                this._data[key][item] = 0;
            }
        }
        this._data[key][name]++;
    }

    _toIncrementObject(row) {
        const incrementObject = {}
        for(let item of this.itemList) incrementObject[`data.${item}`] = row[item];
        return incrementObject;
    }

    storeResults() {
        if(!this._isInitialized) return;
        const updates = this._data;
        this._data = {};
        this._collection.bulkWrite( Object.keys(updates).map((key)=>{
            return {
                updateOne: {
                    "filter" : { _id: key },
                    "update" : {
                        $inc: this._toIncrementObject(updates[key])
                    },
                    "upsert" : true
                }
            }
        })).then((result)=>{}).catch(err=>{})
    }

}

module.exports = AbstractStatistic;
