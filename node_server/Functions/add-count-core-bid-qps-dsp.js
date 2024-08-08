module.exports = (name)=>{
    if( !name || !globalStorage.CoreDSPqps ){
        console.error('Error Not undefined addCountCoreBidQpsDSP() arguments');
        return false;
    }

    if( globalStorage.CoreDSPqps[name] ){
        globalStorage.CoreDSPqps[name]++;
    }
    else{
        globalStorage.CoreDSPqps[name] = 1;
    }

    return true;
};