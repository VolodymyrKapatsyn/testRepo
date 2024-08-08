module.exports = (app) => {
    return (app['bundle'] && app['name'] && app['storeurl'] && (
            app['storeurl'].match(/play\.google\.com/g) !== null ||
            app['storeurl'].match(/itunes/g) !== null
        ) &&
        app['bundle'].split('.').indexOf('') === -1 &&
        app['bundle'][0] !== '.' && app['bundle'][app['bundle'].length - 1] !== '.')
}
