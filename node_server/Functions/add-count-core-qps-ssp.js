module.exports = (name) => {
    if (!name || !globalStorage.CoreQpsSsp) {
        console.error('Error Not undefined addCountCoreQpsSSP() arguments');
        return false;
    }

    if (globalStorage.CoreQpsSsp[name]) {
        globalStorage.CoreQpsSsp[name]++;
    } else {
        globalStorage.CoreQpsSsp[name] = 1;
    }

    return true;
};
