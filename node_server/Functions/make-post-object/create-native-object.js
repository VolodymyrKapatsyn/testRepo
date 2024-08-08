module.exports = (defaultNative, placementParams) => {
    const native = {
        'ver': defaultNative['ver'],
    };

    if (placementParams['battr'] && placementParams['battr'].length > 0) native['battr'] = placementParams['battr'];

    if (Array.isArray(defaultNative['api']) && defaultNative['api'].every((e) => Number.isInteger(e))) {
        native['api'] = defaultNative['api'];
    }

    return native;
};
