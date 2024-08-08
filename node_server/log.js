"use strict";

module.exports.log = function(type, message) {
    let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    switch (type) {
        case 'error':
            console.log('\x1b[34m%s\x1b[0m', date, '\x1b[31m', message, '\x1b[0m');
            break;
        case 'info':
            console.log('\x1b[34m%s\x1b[0m', date, '\x1b[32m', message, '\x1b[0m');
            break;
        default:
            console.log('\x1b[34m%s\x1b[0m', date, '\x1b[37m', message, '\x1b[0m');
            break;
    }
};