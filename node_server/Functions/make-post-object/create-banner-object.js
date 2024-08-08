module.exports = (defaultBanner, placementParams) => {
    const banner = {};

    //REQUEST -> IMP -> Banner -> btype
    defaultBanner['btype'] !== undefined && Array.isArray(defaultBanner['btype']) && (banner['btype'] = defaultBanner['btype'].map(Number));

    //REQUEST -> IMP -> Banner -> mimes
    defaultBanner['mimes'] !== undefined && Array.isArray(defaultBanner['mimes']) && (banner['mimes'] = defaultBanner['mimes']);

    //REQUEST -> IMP -> Banner -> api
    defaultBanner['api'] !== undefined && Array.isArray(defaultBanner['api']) && (banner['api'] = defaultBanner['api']);

    //REQUEST -> IMP -> Banner -> battr
    placementParams['battr'] && placementParams['battr'].length > 0 && (banner['battr'] = placementParams['battr']);

    //REQUEST -> IMP -> Banner -> w,h,hmin,wmin,hmax,wmax
    const [w, h] = placementParams['size'].split('x');
    defaultBanner['w'] && (banner['w'] = parseInt(w, 10));
    defaultBanner['h'] && (banner['h'] = parseInt(h, 10));
    defaultBanner['hmin'] && (banner['hmin'] = defaultBanner['hmin']);
    defaultBanner['wmin'] && (banner['wmin'] = defaultBanner['wmin']);
    defaultBanner['hmax'] && (banner['hmax'] = defaultBanner['hmax']);
    defaultBanner['wmax'] && (banner['wmax'] = defaultBanner['wmax']);

    //REQUEST -> IMP -> Banner -> format
    if (defaultBanner['format'] !== undefined && Array.isArray(defaultBanner['format']) && defaultBanner['format'].length) {
        banner['format'] = [];
        let formatLength = defaultBanner['format'].length - 1;
        for (formatLength; formatLength >= 0; formatLength--) {
            if (defaultBanner['format'][formatLength]) {
                banner['format'][formatLength] = {};
                if (defaultBanner['format'][formatLength]['w'] !== undefined && defaultBanner['format'][formatLength]['h'] !== undefined) {
                    banner['format'][formatLength]['w'] = parseInt(defaultBanner['format'][formatLength]['w']);
                    banner['format'][formatLength]['h'] = parseInt(defaultBanner['format'][formatLength]['h']);
                }
                if (defaultBanner['format'][formatLength]['wratio'] !== undefined && defaultBanner['format'][formatLength]['hratio'] !== undefined) {
                    banner['format'][formatLength]['wratio'] = parseInt(defaultBanner['format'][formatLength]['wratio']);
                    banner['format'][formatLength]['hratio'] = parseInt(defaultBanner['format'][formatLength]['hratio']);
                }
            }
        }
    }

    //REQUEST -> IMP -> Banner -> pos
    if (defaultBanner['pos']) {
        const inputIntegerPos = parseInt(defaultBanner['pos']);
        banner['pos'] = (inputIntegerPos > 0 && inputIntegerPos < 8) ? inputIntegerPos : 1;
    }

    return banner;
};
