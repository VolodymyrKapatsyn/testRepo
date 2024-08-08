const zlib = require('zlib');

module.exports = (response, cb)=>{
    zlib.gzip(response, (err, gzipResponse) => {
        if (err) {
        console.log(err);
        return cb(err);}
        return cb(null, gzipResponse);
    });
};