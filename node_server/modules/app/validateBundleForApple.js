const containOnlyDigits = require('./containOnlyDigits');

const isApple = (device) => {
    return device['os'] === 'ios' || device['os'] === 'mac os'
};

module.exports = (app, device, content) => {
    if (!isApple(device)) return;
    if (containOnlyDigits(app['bundle'])) return;
    if (!app['storeurl']) return;

    const storeUrlArrray = app['storeurl'].split('id');
    const id = storeUrlArrray[storeUrlArrray.length - 1];

    if (containOnlyDigits(id.substr(0, 10)))
        app['bundle'] = id.substr(0, 10);
    else (containOnlyDigits(id.substr(0, 9)) && (app['bundle'] = id.substr(0, 9))) ||
    (content._isBadTrafic = true);
}
