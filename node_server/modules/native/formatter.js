'use strict';

const {
    isObject,
    isInteger,
    isNotEmptyArray,
    isNotEmptyString,
    getAssetType,
    getDSPNativeVersion,
    getEventTracker,
} = require('./utils');
const {getValidatedDSPNativeObject} = require('./validator');

/**
 * Second module function, called to get JSON native object to set in dsp request body
 *
 * @param sspNative - native object from request imp, that formed by previous function - getValidatedSSPImp
 * @param requiredDSPNativeVersion - required by dsp native version. can be 1 (1.0), 2 (1.1) or 3 (1.2)
 * @returns string|false - JSON with native object request or false in case of dsp requirements will be not passed
 */
const getNativeForDSP = (sspNative, requiredDSPNativeVersion) => {
    sspNative = {
        ...sspNative,
        'request': {
            ...sspNative['request'],
        },
    };

    switch (requiredDSPNativeVersion) {
        case 1:
        case 2:
            sspNative['request']['aurlsupport'] = undefined;
            sspNative['request']['durlsupport'] = undefined;
            sspNative['request']['privacy'] = undefined;
            sspNative['request']['eventtrackers'] = undefined;

            const versionToSet = requiredDSPNativeVersion === 1 && '1.0' || '1.1';
            sspNative['request']['ver'] = versionToSet;
            sspNative['ver'] = versionToSet;
            break;
        case 3:
            if (sspNative['ver'] !== '1.2') {
                sspNative['request']['layout'] = undefined;
                sspNative['request']['adunit'] = undefined;
            }

            sspNative['request']['ver'] = '1.2';
            sspNative['ver'] = '1.2';
            break;
        default: break;
    }

    // Specific code, according to incoming traffic (converting "method" => "methods", that is invalid by spec)
    if (sspNative['request']['eventtrackers']) {
        sspNative['request']['eventtrackers'].forEach((tracker) => {
            if (!isNotEmptyArray(tracker['methods']) && isNotEmptyArray(tracker['method'])) {
                tracker['methods'] = tracker['method'];
                tracker['method'] = undefined;
            }
        });

    }

    return JSON.stringify(sspNative['request']);
}

const _formatAssetForBidResponse = (sspAsset, dspAsset, {
    isUpgradeRequired,
    isDowngradeRequired,
}) => {
    const sspAssetType = getAssetType(sspAsset);
    const dspAssetType = getAssetType(dspAsset);
    if (sspAssetType !== dspAssetType) return false;

    switch (sspAssetType) {
        case 'title':
            if (dspAsset['title']['text'].length > sspAsset['title']['len']) {
                dspAsset['title']['text'] = dspAsset['title']['text'].substr(0, sspAsset['title']['len']);
            }
            if (isDowngradeRequired) dspAsset['title']['len'] = undefined;

            break;
        case 'img':
            if (
                sspAsset['img']['wmin'] > dspAsset['img']['w'] ||
                sspAsset['img']['hmin'] > dspAsset['img']['h']
            ) return false;

            const sspWidth = parseInt(sspAsset['img']['w']);
            const sspHeight = parseInt(sspAsset['img']['h']);
            const dspWidth = parseInt(dspAsset['img']['w']);
            const dspHeight = parseInt(dspAsset['img']['h']);

            if (sspWidth && sspHeight && dspWidth && dspHeight) {
                const wRatio = sspWidth / dspWidth;
                const hRatio = sspHeight / dspHeight;

                if (wRatio < 0.5 || wRatio > 2) return false;
                if (hRatio < 0.5 || hRatio > 2) return false;

                const sspRatio = sspWidth / sspHeight;
                const dspRatio = dspWidth / dspHeight;

                if (sspRatio * 0.8 > dspRatio || sspRatio * 1.25 < dspRatio) return false;
            }

            if (sspWidth && sspHeight) {
                dspAsset['img']['w'] = sspWidth;
                dspAsset['img']['h'] = sspHeight;
            } else if (dspWidth && dspHeight) {
                dspAsset['img']['w'] = dspWidth;
                dspAsset['img']['h'] = dspHeight;
            } else if (sspAsset['img']['wmin'] && sspAsset['img']['hmin']) {
                const w = parseInt(sspAsset['img']['wmin']);
                const h = parseInt(sspAsset['img']['hmin']);

                if (w && h) {
                    dspAsset['img']['w'] = w;
                    dspAsset['img']['h'] = h;
                } else {
                    dspAsset['img']['w'] = undefined;
                    dspAsset['img']['h'] = undefined;
                }
            } else {
                dspAsset['img']['w'] = undefined;
                dspAsset['img']['h'] = undefined;
            }

            break;
        case 'video': break;
        case 'data':
            if (isInteger(sspAsset['data']['len']) && dspAsset['data']['value'].length > sspAsset['data']['len']) {
                dspAsset['data']['value'] = dspAsset['data']['value'].substr(0, sspAsset['data']['len']);
            }
            if (isUpgradeRequired) dspAsset['data']['label'] = undefined;
            if (isDowngradeRequired) {
                dspAsset['data']['type'] = undefined;
                dspAsset['data']['len'] = undefined;
            }

            break;
        default: return false;
    }

    return true;
};

/**
 * Third module function, called to get validated dsp adm
 *
 * @param sspNative - native object from request imp, that formed by previous function - getValidatedSSPImp
 * @param dspAdm - adm from dsp response
 * @returns string|false - validated (simple refactored) native object or false in case of invalid response.
 * This object should be not changed due to request lifecycle and at some moment passed to
 * the next function of this module - getBidResponseAdm
 */
const getDSPResponseAdm = (sspNative, dspAdm) => {
    const {data: dspNative, error} = getValidatedDSPNativeObject(dspAdm, sspNative['request']);
    if (error) return {error};

    if (
        typeof dspNative !== 'object' ||
        (
            !dspNative['assets'] &&
            parseInt(sspNative['request']['aurlsupport']) !== 1 &&
            parseInt(sspNative['request']['durlsupport']) !== 1
        )
    ) return {'error': 'invalid_assets'};

    const dspNativeVersion = getDSPNativeVersion(dspNative);
    const isUpgradeRequired = dspNativeVersion !== '1.2' && sspNative['ver'] === '1.2';
    const isDowngradeRequired = dspNativeVersion === '1.2' && sspNative['ver'] !== '1.2';
    const isAssetSrcPresented = isNotEmptyString(dspNative['assetsurl']) || isNotEmptyString(dspNative['dcourl']);

    if (isUpgradeRequired) {
        dspNative['privacy'] = 0;
        dspNative['eventtrackers'] = [];
    }

    if (isDowngradeRequired) {
        if (isAssetSrcPresented) return {'error': 'assets_downgrade_unavailable'};

        if (isNotEmptyArray(dspNative['eventtrackers'])) {
            for (const tracker of dspNative['eventtrackers']) {
                if (parseInt(tracker['event']) !== 1 || parseInt(tracker['method']) !== 1) return {'error': 'eventtrackers_downgrade_unavailable'};

                dspNative['imptrackers'].push(tracker['url']);
            }

            dspNative['eventtrackers'] = undefined;
        }

        dspNative['assetsurl'] = undefined;
        dspNative['dcourl'] = undefined;
        dspNative['privacy'] = undefined;
    }

    if (isNotEmptyArray(dspNative['assets'])) {
        for (let i = 0; i < sspNative['request']['assets'].length; i++) {
            const sspAsset = sspNative['request']['assets'][i];
            const dspAssetIndex = dspNative['assets'].findIndex((asset) => {
                return typeof asset === 'object' && asset['id'] === sspAsset['id'];
            });
            const isFormatted = dspAssetIndex !== -1 && _formatAssetForBidResponse(sspAsset, dspNative['assets'][dspAssetIndex], {
                isUpgradeRequired,
                isDowngradeRequired,
            });

            if (!isFormatted) {
                if (parseInt(sspAsset['required']) === 1) return {'error': 'mismatch_assets'};
                if (dspAssetIndex !== -1) dspNative['assets'].splice(dspAssetIndex, 1);
            }
        }

        for (let i = 0; i < dspNative['assets'].length; i++) {
            if (
                !dspNative['assets'][i] ||
                typeof dspNative['assets'][i] !== 'object' ||
                !sspNative['request']['assets'].find((asset) => {
                    return asset['id'] === dspNative['assets'][i]['id'];
                })
            ) {
                dspNative['assets'].splice(i, 1);
                i--;
            }
        }
    }

    dspNative['ver'] = sspNative['ver'];
    return {'data': JSON.stringify({'native': dspNative})};
};

/**
 * Final module function, called to get bid response adm
 *
 * @param sspNative - native object from request imp, that formed by previous function - getValidatedSSPImp
 * @param dspAdm - adm from dsp response, that refactored by previous function - getDSPResponseAdm
 * @param pixels - array of pixels (protected media, pixalate, etc.)
 * @returns string - adm for bid response, already serialized by JSON.stringify()
 */
const getBidResponseAdm = (sspNative, dspAdm, pixels) => {
    dspAdm = typeof dspAdm === 'string' && JSON.parse(dspAdm) || dspAdm;
    if (!isObject(dspAdm)) return false;

    if (sspNative['ver'] === '1.2') {
        if (!Array.isArray(dspAdm['native']['eventtrackers'])) dspAdm['native']['eventtrackers'] = [];

        pixels.forEach((pixel) => {
            if (pixel === '') return;
            const tracker = getEventTracker(pixel);

            dspAdm['native']['eventtrackers'].push(tracker);
            dspAdm['native']['imptrackers'].push(pixel);
        });
    } else {
        pixels.forEach((pixel) => {
            if (pixel === '') return;
            dspAdm['native']['imptrackers'].push(pixel);
        });
    }

    return JSON.stringify({'native': dspAdm['native']});
};

module.exports = {
    getNativeForDSP,
    getDSPResponseAdm,
    getBidResponseAdm,
};
