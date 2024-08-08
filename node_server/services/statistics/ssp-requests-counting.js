const AbstractStatistic = require('./abstract-statistic');

class SspRequestsCounting extends AbstractStatistic {
    constructor(isActive) {
        super('ssphourlystat', 10);// time in minutes
        super._isEnabled = !!isActive; // kostyl'
        this._itemList = ['amount'];
    }

    countRequests(sspName) {
        this.createOrIncrement(sspName, 'amount');
    }
}

module.exports = SspRequestsCounting;