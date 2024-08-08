const createRedisClient = require('redis').createClient;

const client = createRedisClient({
    url: 'redis://192.168.100.2:6379'
});

client.on('error', err => console.log('Redis Client Error', err));


setTimeout(async ()=> {
    await client.connect();
    await client.set('key', 'value');
    client.get('key', (err, data) => {
        console.log(data)
    });
   // console.log(value)
}, 1000)

