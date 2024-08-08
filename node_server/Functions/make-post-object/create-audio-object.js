module.exports = (defaultAudio, placementParams) => {

    const audio = {
        minduration: defaultAudio['minduration'] || 0,
        maxduration: defaultAudio['maxduration'] || 999
    };

    //REQUEST -> IMP -> audio -> w,h

    //REQUEST -> IMP -> audio -> mimes
    defaultAudio['mimes'] && Array.isArray(defaultAudio['mimes']) && (audio['mimes'] = defaultAudio['mimes']);

    //REQUEST -> IMP -> audio -> protocol
    defaultAudio['protocol'] && (audio['protocol'] = parseInt(defaultAudio['protocol']));

    //REQUEST -> IMP -> audio -> protocols
    defaultAudio['protocols'] && Array.isArray(defaultAudio['protocols']) && (audio['protocols'] = defaultAudio['protocols'].map(Number));

    //REQUEST -> IMP -> audio -> startdelay
    defaultAudio['startdelay'] && (audio['startdelay'] = parseInt(defaultAudio['startdelay']));

    //REQUEST -> IMP -> audio -> api
    defaultAudio['api'] && Array.isArray(defaultAudio['api']) && (audio['api'] = defaultAudio['api'].map(Number));

    //REQUEST -> IMP -> audio -> battr
    placementParams.battr && placementParams.battr.length > 0 && (audio['battr'] = placementParams.battr);

    //REQUEST -> IMP -> audio -> pos
    defaultAudio['pos'] && (audio['pos'] = parseInt(defaultAudio['pos']));

    //REQUEST -> IMP -> audio -> delivery
    defaultAudio['delivery'] && Array.isArray(defaultAudio['delivery']) && (audio['delivery'] = defaultAudio['delivery'].map(Number));

    //REQUEST -> IMP -> audio -> maxbitrate
    defaultAudio['maxbitrate'] && (audio['maxbitrate'] = defaultAudio['maxbitrate']);

    //REQUEST -> IMP -> audio -> minbitrate
    defaultAudio['minbitrate'] && (audio['minbitrate'] = defaultAudio['minbitrate']);

    //REQUEST -> IMP -> audio -> maxextended
    defaultAudio['maxextended'] && (audio['maxextended'] = defaultAudio['maxextended']);

    //REQUEST -> IMP -> audio -> maxseq
    defaultAudio['maxseq'] && (audio['maxseq'] = defaultAudio['maxseq']);

    //REQUEST -> IMP -> audio -> startdelay
    defaultAudio['startdelay'] !== undefined && (audio['startdelay'] = defaultAudio['startdelay']);

    //REQUEST -> IMP -> audio -> ext
    if (defaultAudio['ext']) {
        audio['ext'] = {};

        //REQUEST -> IMP -> audio -> ext -> audiotype
        defaultAudio['ext']['audiotype'] === 'rewarded' && (audio['ext']['audiotype'] = 'rewarded');

        //REQUEST -> IMP -> audio -> ext -> rewarded
        defaultAudio['ext']['rewarded'] == 1 && (audio['ext']['rewarded'] = 1);
    }
    return audio;
};
