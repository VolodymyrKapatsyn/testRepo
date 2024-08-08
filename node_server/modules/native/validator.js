'use strict';

const {
    isObject,
    isInteger,
    isString,
    isNotEmpty,
    isNotEmptyString,
    isNotEmptyArray,
    getAssetType,
    getSSPNativeVersion,
    getDSPNativeVersion,
} = require('./utils');

const isRequestEventTrackersValid = (nativeObject) => {
    if (nativeObject['ver'] === '1.2' && isObject(nativeObject['eventtrackers'])) {
        return nativeObject['eventtrackers'].every((tracker) => {
            // Specific code, according to incoming traffic (verifying on "method", that is invalid by spec)
            const methods = isNotEmptyArray(tracker['methods']) && tracker['methods'] ||
                isNotEmptyArray(tracker['method']) && tracker['method'];

            return isInteger(tracker['event']) && methods && methods.every((m) => Number.isInteger(m));
        });
    }

    return true;
};

const isResponseEventTrackersValid = (nativeObject) => {
    if (nativeObject['ver'] === '1.2' && isObject(nativeObject['eventtrackers'])) {
        return nativeObject['eventtrackers'].every((tracker) => {
            return isInteger(tracker['event']) &&
                isInteger(tracker['method']) &&
                isNotEmptyString(tracker['url']);
        });
    }

    return true;
};

/**
 * First module function, called to get validated request native object
 *
 * @param nativeObject - native object from request imp (as example: bidRequest['imp'][0]['native'])
 * @returns object|false - validated (simple refactored) native object or false in case of invalid request
 * This object should be not changed due to request lifecycle and at some moment passed to
 * the next function of this module - getDSPResponseAdm. Always have "ver" field on top level
 */
const getValidatedSSPImp = (nativeObject) => {
    if (!isObject(nativeObject)) return false;
    nativeObject = {...nativeObject};

    let request;
    try {
        request = typeof nativeObject['request'] === 'string' && JSON.parse(nativeObject['request']) ||
            isObject(nativeObject['request']) && {...nativeObject['request']};
        request = isObject((request || {})['native']) && request['native'] || request;
    } catch { return false; }

    if (typeof request !== 'object' || !isNotEmptyArray(request['assets'])) return false;

    request['ver'] = getSSPNativeVersion(nativeObject, request);
    if (!request['ver']) return false;

    const assetsIds = [];

    for (let asset of request['assets']) {
        if (!isObject(asset)) return false;

        asset['id'] = parseInt(asset['id']);
        if (Number.isInteger(asset['id']) === false) return false;
        assetsIds.push(asset['id']);

        const type = getAssetType(asset);
        switch (type) {
            case 'title':
                if (
                    isNotEmpty(asset['img']) ||
                    isNotEmpty(asset['video']) ||
                    isNotEmpty(asset['data']) ||
                    !isInteger(asset['title']['len'])
                ) return false;

                break;
            case 'img':
                if (
                    isNotEmpty(asset['title']) ||
                    isNotEmpty(asset['video']) ||
                    isNotEmpty(asset['data'])
                ) return false;

                break;
            case 'video':
                if (
                    isNotEmpty(asset['title']) ||
                    isNotEmpty(asset['img']) ||
                    isNotEmpty(asset['data']) ||
                    !isNotEmptyArray(asset['video']['mimes']) ||
                    asset['video'].hasOwnProperty('minduration') && !isInteger(asset['video']['minduration']) ||
                    asset['video'].hasOwnProperty('maxduration') && !isInteger(asset['video']['maxduration']) ||
                    asset['video'].hasOwnProperty('protocols')  &&
                    (
                        !isNotEmptyArray(asset['video']['protocols']) ||
                        asset['video']['protocols'].some((p) => !Number.isInteger(p))
                    )
                ) return false;

                break;
            case 'data':
                if (
                    isNotEmpty(asset['title']) ||
                    isNotEmpty(asset['img']) ||
                    isNotEmpty(asset['video']) ||
                    !isInteger(asset['data']['type'])
                ) return false;

                break;
            default: return false;
        }
    }

    if (!isRequestEventTrackersValid(request)) return false;
    if (assetsIds.length !== [...new Set(assetsIds)].length) return false;

    if (nativeObject.hasOwnProperty('adunit') && parseInt(nativeObject['adunit']) > 5) {
        nativeObject['adunit'] = 2;
    }
    if (nativeObject.hasOwnProperty['plcmtcnt']) {
        nativeObject['plcmtcnt'] = 1;
    }

    nativeObject['request'] = request;
    nativeObject['ver'] = request['ver'];

    return nativeObject;
};

const getValidatedDSPNativeObject = (adm) => {
    try {
        adm = typeof adm === 'string' && JSON.parse(adm) || {...adm};
    } catch { return {'error': 'adm_parse_error'}; }

    if (!isObject(adm)) return {'error': 'invalid_adm'};

    const nativeObject = isObject(adm['native']) && adm['native'] || adm;
    if (!isObject(nativeObject['link']) || !isNotEmptyString(nativeObject['link']['url'])) return {'error': 'invalid_link_url'};

    nativeObject['ver'] = getDSPNativeVersion(nativeObject);
    if (!nativeObject['ver'] ) return {'error': 'invalid_version'};

    const assetsIds = [];

    if (isNotEmptyArray(nativeObject['assets'])) {
        for (const asset of nativeObject['assets']) {
            if (!isObject(asset)) return {'error': 'invalid_asset_id'};

            asset['id'] = parseInt(asset['id']);
            if (Number.isInteger(asset['id']) === false) return {'error': 'invalid_asset_id'};
            assetsIds.push(asset['id']);

            const type = getAssetType(asset);
            switch (type) {
                case 'title':
                    if (
                        isNotEmpty(asset['img']) ||
                        isNotEmpty(asset['video']) ||
                        isNotEmpty(asset['data']) ||
                        !isNotEmptyString(asset['title']['text'])
                    ) return {'error': 'invalid_title_asset'};

                    break;
                case 'img':
                    if (
                        isNotEmpty(asset['title']) ||
                        isNotEmpty(asset['video']) ||
                        isNotEmpty(asset['data']) ||
                        !isNotEmptyString(asset['img']['url'])
                    ) return {'error': 'invalid_img_asset'};

                    if (asset['img']['url'].indexOf('http') === -1) asset['img']['url'] = `https:${asset['url']}`;

                    break;
                case 'video':
                    if (
                        isNotEmpty(asset['title']) ||
                        isNotEmpty(asset['img']) ||
                        isNotEmpty(asset['data']) ||
                        !isNotEmptyString(asset['video']['vasttag']) ||
                        asset['video']['vasttag'].toLowerCase().indexOf('vast') === -1
                    ) return {'error': 'invalid_video_asset'};

                    break;
                case 'data':
                    if (
                        isNotEmpty(asset['title']) ||
                        isNotEmpty(asset['img']) ||
                        isNotEmpty(asset['video']) ||
                        !isString(asset['data']['value'])
                    ) return {'error': 'invalid_data_asset'};

                    break;
                default: return {'error': 'unknown_asset_type'};
            }
        }
    } else {
        if (!(isNotEmptyString(nativeObject['assetsurl']) || isNotEmptyString(nativeObject['dcourl']))) return {'error': 'absent_assets'};
        nativeObject['assets'] = undefined;
    }

    if (!isResponseEventTrackersValid(nativeObject)) return {'error': 'invalid_eventtrackers'};
    if (assetsIds.length !== [...new Set(assetsIds)].length) return {'error': 'invalid_assets_ids'};

    if (
        !Array.isArray(nativeObject['imptrackers']) ||
        !nativeObject['imptrackers'].every((elem) => isString(elem))
    ) {
        nativeObject['imptrackers'] = (isNotEmptyString(nativeObject['imptrackers']) && [nativeObject['imptrackers']])
            || [];
    }

    if (nativeObject.hasOwnProperty('privacy')) nativeObject['privacy'] = Number(Boolean(nativeObject['privacy']));

    return {'data': nativeObject};
};

module.exports = {
    getValidatedSSPImp,
    getValidatedDSPNativeObject,
};
