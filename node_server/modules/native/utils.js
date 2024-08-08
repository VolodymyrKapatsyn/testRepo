'use strict';

const DEFAULT_NATIVE_VERSION = '1.1';
const SUPPORTED_VERSIONS = ['1', '1.0', '1.1', '1.2'];

const isObject = (data) => {
    return data !== null && typeof data === 'object' && !Array.isArray(data);
};

const isInteger = (data) => {
    return Number.isInteger(parseInt(data));
};

const isString = (data) => {
    return typeof data === 'string';
};

const isNotEmpty = (data) => {
    return data !== undefined && data !== null;
};

const isNotEmptyArray = (data) => {
    return Array.isArray(data) && data.length !== 0;
};

const isNotEmptyString = (data) => {
    return typeof data === 'string' && data.length !== 0;
};

const getAssetType = (asset) => {
    return isObject(asset['title']) && 'title' ||
        isObject(asset['img']) && 'img' ||
        isObject(asset['video']) && 'video' ||
        isObject(asset['data']) && 'data';
};

const getSSPNativeVersion = (nativeObject, request = {}) => {
    let version = String(nativeObject['ver'] || request['ver'] || '').slice(0, 3);
    if (!SUPPORTED_VERSIONS.includes(version)) version = false;

    if (!version) {
        version = (
            nativeObject['eventtrackers'] ||
            nativeObject['aurlsupport'] ||
            nativeObject['durlsupport'] ||
            nativeObject['privacy']
        ) && '1.2' || DEFAULT_NATIVE_VERSION;
    }

    return version;
};

const getDSPNativeVersion = (nativeObject) => {
    let version = String(nativeObject['ver'] || '').slice(0, 3);
    if (!SUPPORTED_VERSIONS.includes(version)) version = false;

    if (!version) {
        version = (
            isNotEmptyArray(nativeObject['eventtrackers']) ||
            isNotEmptyString(nativeObject['privacy'])
        ) && '1.2' || DEFAULT_NATIVE_VERSION;
    }

    return version;
};

const getEventTracker = (pixel) => {
    return {
        'event': 1,
        'method': 1,
        'url': pixel,
    };
};

module.exports = {
    DEFAULT_NATIVE_VERSION,
    isObject,
    isInteger,
    isString,
    isNotEmpty,
    isNotEmptyArray,
    isNotEmptyString,
    getAssetType,
    getSSPNativeVersion,
    getDSPNativeVersion,
    getEventTracker,
};
