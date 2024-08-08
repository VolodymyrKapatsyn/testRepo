const containOnlyDigits = require('./containOnlyDigits');

module.exports = (app, content) => {

    //new bundles for scape
    const lowerCaseBundle = app['bundle'].toLowerCase();
    const bundleKey = app['bundle'].replace(/\./g, ',');

    if (app['cat'].indexOf('IAB24') !== -1) app['cat'].splice(app['cat'].indexOf('IAB24'), 1);

    if (globalStorage.confirmedBundles[lowerCaseBundle] !== undefined) {

        app['name'] = globalStorage.confirmedBundles[lowerCaseBundle]['name'];
        app['publisher']['name'] = globalStorage.confirmedBundles[lowerCaseBundle]['pubName'];
        app['storeurl'] = containOnlyDigits(app['bundle']) ?
            `https://itunes.apple.com/app/id${app['bundle']}` :
            `https://play.google.com/store/apps/details?id=${app['bundle']}`;

        if (app['cat'].length < 6) {
            let recheck = false;
            for (let i = 0, len = app['cat'].length; i < len; ++i) {
                if (!globalStorage.confirmedBundles[lowerCaseBundle]['cats'].includes(app['cat'][i])) {
                    globalStorage.confirmedBundles[lowerCaseBundle]['cats'].push(app['cat'][i]);
                    recheck = true;
                }
            }
            if (recheck) {
                globalStorage.bundlesForCheck[bundleKey] = globalStorage.confirmedBundles[lowerCaseBundle]['cats'];
            }
        }

        app['cat'] = globalStorage.confirmedBundles[lowerCaseBundle]['cats'];

    } else if (globalStorage.checkedBundles[lowerCaseBundle] !== undefined) {
        app['name'] = globalStorage.checkedBundles[lowerCaseBundle]['name'];
    } else {
        if (app['cat'].length < 6) {
            if (globalStorage.bundlesForCheck[bundleKey] !== undefined) {
                let concatArr = globalStorage.bundlesForCheck[bundleKey];
                let uniqueObj = {};

                for (let i = 0, len = app['cat'].length; i < len; ++i) {
                    concatArr.push(app['cat'][i]);
                }

                for (let i = 0, len = concatArr.length; i < len; ++i) {
                    if (uniqueObj[concatArr[i]] === undefined) {
                        uniqueObj[concatArr[i]] = true;
                    }
                }

                globalStorage.bundlesForCheck[bundleKey] = Object.keys(uniqueObj);
            } else {
                globalStorage.bundlesForCheck[bundleKey] = app['cat'];
            }
        }

        if (app['cat'].length === 0) app['cat'] = ['IAB1'];
        content._isBadTrafic = true;
    }
    ////////////
    // remove cats if length > 7
    app['cat'].splice(7);

    (!app['name'] || app['name'] === '') && (app['name'] = app['bundle']);
};
