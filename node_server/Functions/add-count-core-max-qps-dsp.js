module.exports = (name) => {
    if (!name || !globalStorage.CoreMaxQpsDsp) {
        console.error('Error Not undefined addCountCoreQpsSSP() arguments');
        return false;
    }

    if (globalStorage.CoreMaxQpsDsp[name]) {
        globalStorage.CoreMaxQpsDsp[name]++;
    } else {
        globalStorage.CoreMaxQpsDsp[name] = 1;
    }

    return true;
};
