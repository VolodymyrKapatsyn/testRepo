const hasGooglePlayId = (text)=>{
    return text != undefined && 
            text.match(/play\.google\.com/g) !== null && 
            text.indexOf('id=') !== -1;
}

module.exports = (app)=>{
    if(app['bundle'].length >= 5) return;
    if (!hasGooglePlayId(app["storeurl"])) return;

    app['bundle'] = app["storeurl"].substr(app["storeurl"].indexOf('id=') + 3);
    const ampPosition = app['bundle'].indexOf('&');
    ampPosition !== -1 && (app['bundle'] = app["storeurl"].substr(0,ampPosition));
}