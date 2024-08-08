module.exports = (defaultVideo, placementParams) => {

    const video = {
        minduration: defaultVideo['minduration'] || 0,
        maxduration: defaultVideo['maxduration'] || 999,
        boxingallowed: defaultVideo['boxingallowed'] || 1,
        skip: parseInt(defaultVideo['skip']) || 0,
        mimes: []
    };

    //REQUEST -> IMP -> video -> w,h
    defaultVideo['w'] && (video['w'] = parseInt(defaultVideo['w'], 10));
    defaultVideo['h'] && (video['h'] = parseInt(defaultVideo['h'], 10));

    //REQUEST -> IMP -> video -> mimes
    if (defaultVideo['mimes'] && Array.isArray(defaultVideo['mimes'])) {
        for (let i = 0; i < defaultVideo['mimes'].length; i++) {
            if (defaultVideo['mimes'][i] && typeof defaultVideo['mimes'][i] === 'string') video['mimes'].push(defaultVideo['mimes'][i])
        }
        video['mimes'].length === 0 && (video['mimes'].push('video/mp4'));
    }

    //REQUEST -> IMP -> video -> protocol
    defaultVideo['protocol'] && (video['protocol'] = parseInt(defaultVideo['protocol']));

    //REQUEST -> IMP -> video -> protocols
    defaultVideo['protocols'] && Array.isArray(defaultVideo['protocols']) && (video['protocols'] = defaultVideo['protocols'].map(Number));

    //REQUEST -> IMP -> video -> linearity
    defaultVideo['linearity'] && (video['linearity'] = parseInt(defaultVideo['linearity']));

    //REQUEST -> IMP -> video -> startdelay
    defaultVideo['startdelay'] && (video['startdelay'] = parseInt(defaultVideo['startdelay']));

    //REQUEST -> IMP -> video -> skipmin
    defaultVideo['skipmin'] !== undefined && (video['skipmin'] = parseInt(defaultVideo['skipmin']));

    //REQUEST -> IMP -> video -> skipafter
    defaultVideo['skipafter'] !== undefined && (video['skipafter'] = parseInt(defaultVideo['skipafter']));

    //REQUEST -> IMP -> video -> api
    defaultVideo['api'] && Array.isArray(defaultVideo['api']) && (video['api'] = defaultVideo['api'].map(Number));

    //REQUEST -> IMP -> video -> battr
    placementParams.battr && placementParams.battr.length > 0 && (video['battr'] = placementParams.battr);

    //REQUEST -> IMP -> video -> pos
    defaultVideo['pos'] && (video['pos'] = parseInt(defaultVideo['pos']));

    //REQUEST -> IMP -> video -> delivery
    defaultVideo['delivery'] && Array.isArray(defaultVideo['delivery']) && (video['delivery'] = defaultVideo['delivery'].map(Number));

    //REQUEST -> IMP -> video -> maxbitrate
    defaultVideo['maxbitrate'] && (video['maxbitrate'] = defaultVideo['maxbitrate']);

    //REQUEST -> IMP -> video -> minbitrate
    defaultVideo['minbitrate'] && (video['minbitrate'] = defaultVideo['minbitrate']);

    //REQUEST -> IMP -> video -> maxextended
    defaultVideo['maxextended'] && (video['maxextended'] = defaultVideo['maxextended']);

    //REQUEST -> IMP -> video -> playbackmethod
    defaultVideo['playbackmethod'] && Array.isArray(defaultVideo['playbackmethod']) && (video['playbackmethod'] = defaultVideo['playbackmethod'].map(Number));

    // //REQUEST -> IMP -> video -> ext
    if (defaultVideo['ext']) {
        video['ext'] = {};

        //REQUEST -> IMP -> video -> ext -> rewarded
        if (defaultVideo['ext']['videotype'] === 'rewarded' || defaultVideo['ext']['rewarded'] == 1) {
            video['ext']['videotype'] = 'rewarded';
            video['ext']['rewarded'] = 1;
        }
        defaultVideo.ext.outstream === 1 && (video.ext.outstream = 1);
    }

    return video;
};
