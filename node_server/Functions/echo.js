const fs = require('fs');
// const {PrometheusService} = require("../services/prometheus/prometheus.service");

module.exports.echoBadEnd = (res, reasons = undefined) => {
    res.writeHead(400, { 'Content-Type': 'text/plain' });//content type
    res.end('');
};

module.exports.echoGoodEnd = (res, content) => {
    res.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'application/json; charset=UTF-8', 'Content-Length': Buffer.byteLength(content, 'utf8') });//content type
    res.end(content);
};

module.exports.echoLog = (res)=>{
    const path = `/nodejs/node_logs/detectedproblems${new Date().toISOString().slice(0,10)}.txt`;
    const stat = fs.statSync(path);
    res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': stat.size
    });
    const readStream = fs.createReadStream(path);
    readStream.pipe(res);
};

module.exports.echoGzipResponse = (res, content) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin':'*',
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': Buffer.byteLength(content, 'utf8'),
        'Content-Encoding': 'gzip'
    });
    res.end(content);
};

module.exports.echoEcho = (res, content) => {
    res.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'text/html; charset=UTF-8', 'Content-Length': Buffer.byteLength(content, 'utf8') });//content type
    res.end(content);
};

module.exports.echoGoodEndXml = (res, content) => {
    res.writeHead(200, {'Access-Control-Allow-Origin':'*', 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(content, 'utf8') });//content type
    res.end(content);
};

module.exports.echoNoBidEnd = (res, reasons = undefined) => {
    //PrometheusService.getInstance().inc(`ad_ex_total_echo_no_bid_end`,
    //    { total: 'total' })
    res.writeHead(204, { 'Access-Control-Allow-Origin':'*', 'Content-Type': 'text/plain' });//content type
    res.end('');
};

module.exports.echoRedirect = (res, url) => {
    res.writeHead(302, { 'Location': `${url}` });//content type
    res.end('');
};
