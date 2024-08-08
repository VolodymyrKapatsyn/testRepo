'use strict';

const {getNativeForDSP, getDSPResponseAdm, getBidResponseAdm} = require('./formatter');
const {getValidatedSSPImp} = require('./validator');

/**
 * Module order of use due to request lifecycle:
 *
 * 1. getValidatedSSPImp
 * 2. getNativeForDSP
 * 3. getDSPResponseAdm
 * 4. getBidResponseAdm
 */

module.exports = {
    getValidatedSSPImp,
    getNativeForDSP,
    getDSPResponseAdm,
    getBidResponseAdm,
};
