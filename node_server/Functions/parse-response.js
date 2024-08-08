module.exports = (data, reqResStorage) => {
    try {
        const response = JSON.parse(data);

        reqResStorage.save('bidResponse', globalStorage.dspPartners[response['dsp']]['id'], response['data']);

        if (response['data']['seatbid'][0]) {
            if (response['data']['seatbid'].length > 1) {
                const winlocal = [];
                for (let k = 0; k < response['data']['seatbid'].length; k++) {   /////local auction from one dsp
                    if (!winlocal[0] || winlocal[0] < response['data']['seatbid'][k]['bid'][0]['price']) {
                        winlocal[0] = response['data']['seatbid'][k]['bid'][0]['price'];
                        winlocal[1] = k;
                    }
                }
                const wn = response['data']['seatbid'][winlocal[1]];
                response['data']['seatbid'] = [];
                response['data']['seatbid'][0] = wn;
            }
            return response;
        } else return false;
    } catch (e) {
        console.error(`Error parsing response. ${e.name}:${e.message}, response: ${data}`);
        return false;
    }
};
