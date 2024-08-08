const zlib = require('zlib');

module.exports = (data, encoding) => {
    return new Promise((resolve, reject) => {
        const buf = Buffer.from(data, 'utf8');
        if (encoding === 'gzip') {
            zlib.gunzip(buf, (err, decoded) => {
                if (err) return reject(err);
                console.log('gzip');
                data = decoded && decoded.toString();
                return resolve(data);
            });
        } else if (encoding === 'deflate') {
            zlib.inflate(buf, (err, decoded) => {
                if (err) return reject(err);
                console.log('deflate');
                data = decoded && decoded.toString();
                return resolve(data);
            });
        } else resolve(data);
    });
};
