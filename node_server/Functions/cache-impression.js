module.exports = (sspName, dspName, bidPrice, ourBidPrice)=>{
    globalServices.cached.responseimpressions.updateOne({
        "ssp": sspName,
        "dsp": dspName
    }, {
        $inc: {
            "cnt": 1,
            "bidprice": bidPrice / 1000,
            "ourbidprice": ourBidPrice / 1000
        }
    }, {upsert: true, safe: false}, (err)=>{
        if(err){ 
            console.error("empf() 1", err); 
        }
    });
};