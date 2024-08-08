const SUPPORTED_VERSIONS = ['1.0', '2.0', '2.1', '2.2'];
const DEFAULT_SKADN_VERSION = '2.1';

const isObject = (data) => {
    return data !== null && typeof data === 'object' && !Array.isArray(data);
};

const isNotEmptyArray = (data) => {
    return Array.isArray(data) && data.length !== 0;
};

const isNotEmptyString = (data) => {
    return typeof data === 'string' && data.length !== 0;
};

const getValidatedSSPData = (skadn, bundle) => {
    if (!isObject(skadn)) return false;

    const result = {};

    if (isNotEmptyArray(skadn['versions'])) {
        const versions = skadn['versions']
            .map((version) => {
                version = `${version}.1`.slice(0, 3);
                return SUPPORTED_VERSIONS.includes(version) && version || false;
            })
            .filter((version) => Boolean(version));

        if (versions.length) result['versions'] = versions;
    }

    const version = skadn['version'] && `${skadn['version']}.1`.slice(0, 3);
    if (SUPPORTED_VERSIONS.includes(version)) {
        result['version'] = version;
        if (result['versions'] && !result['versions'].includes(version)) result['versions'].push(version);
    }

    if (!result['version'] && !result['versions']) return false;

    const sourceapp = isNotEmptyString(bundle) && bundle || skadn['sourceapp'];
    if (!isNotEmptyString(sourceapp)) return false;

    result['sourceapp'] = sourceapp; // should always be equal to BidRequest.app.bundle

    if (isNotEmptyArray(skadn['skadnetids'])) {
        const skadnetids = skadn['skadnetids']
            .map((id) => typeof id === 'string' && id.toLowerCase() || false)
            .filter((id) => Boolean(id));

        if (skadnetids.length) result['skadnetids'] = skadnetids;
    }

    if (isObject(skadn['ext'])) result['ext'] = skadn['ext'];

    if (isObject(skadn['skadnetlist'])) {
        const skadnetlist = {};

        const max = Number(skadn['skadnetlist']['max']);
        if (Number.isInteger(max)) skadnetlist['max'] = max;

        if (isNotEmptyArray(skadn['skadnetlist']['excl'])) {
            const excl = skadn['skadnetlist']['excl']
                .map((id) => {
                    id = Number(id);
                    return Number.isInteger(id) && id || false;
                })
                .filter((id) => Boolean(id));

            if (excl.length) skadnetlist['excl'] = excl;
        }

        if (isNotEmptyArray(skadn['skadnetlist']['addl'])) {
            const addl = skadn['skadnetlist']['addl']
                .map((id) => typeof id === 'string' && id.toLowerCase() || false)
                .filter((id) => Boolean(id));

            if (addl.length) skadnetlist['addl'] = addl;
        }

        if (isObject(skadn['skadnetlist']['ext'])) skadnetlist['ext'] = skadn['skadnetlist']['ext'];

        result['skadnetlist'] = skadnetlist;
    }

    return result;
};

const getValidatedDSPData = (dspSkadn, sspSkadn, bundle) => {
    if (!isObject(dspSkadn) || !isObject(sspSkadn)) return false;

    const result = {};
    const version = dspSkadn['version'] && `${dspSkadn['version']}.1`.slice(0, 3);
    const isFidelitiesPresented = isNotEmptyArray(dspSkadn['fidelities']);

    if (SUPPORTED_VERSIONS.includes(version)) result['version'] = isFidelitiesPresented && '2.2' || version;
    else result['version'] = sspSkadn['version'] ||
        (isNotEmptyArray(dspSkadn['fidelities']) && '2.2') ||
        DEFAULT_SKADN_VERSION;

    const skadnetids = [...(sspSkadn['skadnetids'] || []), ...((sspSkadn['skadnetlist'] || {})['addl'] || [])];
    if (
        !isNotEmptyString(dspSkadn['network']) ||
        skadnetids.length && !skadnetids.includes(dspSkadn['network'])
    ) return false;

    result['network'] = dspSkadn['network'];

    if (isNotEmptyString(dspSkadn['signature'])) result['signature'] = dspSkadn['signature'];

    const campaign = Number(dspSkadn['campaign']);
    if (
        campaign &&
        Number.isInteger(campaign) &&
        campaign >= 1 &&
        campaign <= 100
    ) result['campaign'] = String(campaign);

    result['itunesitem'] = dspSkadn['itunesitem'] || bundle; // should always be equal to BidResponse.seatbid.bid.bundle, if exists
    if (
        !isNotEmptyString(result['itunesitem']) ||
        (bundle && result['itunesitem'] !== bundle)
    ) return false;

    if (!isNotEmptyString(dspSkadn['nonce']) || !dspSkadn['nonce'].includes('-')) return false;
    result['nonce'] = dspSkadn['nonce']; // nonce - UUID

    if (dspSkadn['sourceapp'] !== sspSkadn['sourceapp']) return false;
    result['sourceapp'] = dspSkadn['sourceapp'];

    const timestamp = Number(dspSkadn['timestamp']);
    if (Number.isInteger(timestamp)) result['timestamp'] = timestamp;
    if (isObject(dspSkadn['ext'])) result['ext'] = dspSkadn['ext'];

    if (isFidelitiesPresented) {
        const fidelities = dspSkadn['fidelities']
            .map((fidelity) => {
                const result = {};

                const _fid = Number(fidelity['fidelity']);
                if (!_fid && _fid !== 0) return false;
                result['fidelity'] = _fid;

                if (
                    !isNotEmptyString(fidelity['nonce']) ||
                    !fidelity['nonce'].includes('-')
                ) return false;
                result['nonce'] = fidelity['nonce']; // nonce - UUID

                const timestamp = Number(fidelity['timestamp']);
                if (Number.isInteger(timestamp)) result['timestamp'] = timestamp;

                if (!isNotEmptyString(fidelity['signature'])) return false;
                result['signature'] = fidelity['signature'];

                if (isObject(dspSkadn['ext'])) result['ext'] = dspSkadn['ext'];

                return result;
            })
            .filter((fidelity) => Boolean(fidelity));

        if (fidelities.length) result['fidelities'] = fidelities;
    }

    if (!isNotEmptyString(result['signature']) && !isNotEmptyArray(result['fidelities'])) return false;

    return result;
};

module.exports = {
    getValidatedSSPData,
    getValidatedDSPData,
};
