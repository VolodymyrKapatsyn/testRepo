const anonymizeData = bidRequest => {
    if(bidRequest['device']['ip'])  {
        let requestIpArray = bidRequest['device']['ip'].split('.');
        requestIpArray[requestIpArray.length -1] = 0;

        bidRequest['device']['ip'] = requestIpArray.join('.');
    }

    bidRequest['device']['geo'] =  {
        country: bidRequest['device']['geo']['country'],
        region:  bidRequest['device']['geo']['region'],
        city:  bidRequest['device']['geo']['city'],
    };

    delete bidRequest['device']['ifa'];
    delete bidRequest['device']['ipv6'];
    delete bidRequest['device']['didsha1'];
    delete bidRequest['device']['didsha5'];
    delete bidRequest['device']['dpidsha1'];
    delete bidRequest['device']['dpidsha5'];
    delete bidRequest['device']['macsha1'];
    delete bidRequest['device']['macmd5'];

    bidRequest['user'] = {};

    return bidRequest;
};

module.exports.anonymizeData = anonymizeData;
