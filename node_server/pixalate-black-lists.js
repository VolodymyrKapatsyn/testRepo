'use strict'
const region = require('./configs/serverconfig.json').region;
const config = require('./configs/config.json');
const fs = require('fs');
const http =require('http');

function uploadPixalate() {

    http.get({
        host: config.settingsApi[region].host,
        port: 3000,
        path: `/getPixalate?pwd=${config.settingsApiPassword}`,
    }, (res) => {
        let stream = fs.createWriteStream('/nodejs/node_server/objects/blockedIp.conf');
        res.pipe(stream);
        res.on('end', function() {
            process.send({'name': 'blockedIp', 'val': 'file'});
        });
    }).on('error', error => {
        console.log(error);
        fs.writeFile('/nodejs/node_server/objects/blockedIp.conf', JSON.stringify({}), error => {
            if (!error) {
                process.send({'name': 'blockedIp', 'val': 'file'});
            }
        });
    });
}

setTimeout(uploadPixalate, 45 * 1000);
setInterval(uploadPixalate, 24 * 60 * 60 * 1000);
