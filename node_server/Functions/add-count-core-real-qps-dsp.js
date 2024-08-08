module.exports = (name)=>{
    if( !globalStorage.CoreRealQpsDsp || !name ){
        console.error('Error Not undefined addCountCoreRealQpsDSP() arguments');
        return false;
    }
    if( globalStorage.CoreRealQpsDsp[name] ){
        globalStorage.CoreRealQpsDsp[name]++;
    }
    else{
        globalStorage.CoreRealQpsDsp[name] = 1;
    }

    return true;
};