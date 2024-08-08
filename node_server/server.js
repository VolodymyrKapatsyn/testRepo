'use strict';

///////////////////////////////////////////////// INCLUDE //////////////////////////////////////////////////////////////
const cluster = require('cluster');
const os      = require('os');
const fs      = require('fs');
const async   = require('async');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////// ADD MONITORING ///////////////////////////////////////////////////////
const http = require('http');
const client = require('prom-client');
const AggregatorRegistry = client.AggregatorRegistry;
const collectDefaultMetrics = client.collectDefaultMetrics;
const aggregatorRegistry = new AggregatorRegistry();
let HTTPServer = http.createServer();
HTTPServer.on('connection', (socket) => {
    socket.setNoDelay(true);
});

HTTPServer.on('request', async (req, res) => {

    try{
    // Create a Promise for each worker's metrics
        const metricsPromises = Object.values(cluster.workers).map(worker => {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout waiting for metrics from worker'));
                }, 5000); // 5 seconds timeout for each worker

                const handleMessage = (message) => {
                    clearTimeout(timeout);
                    worker.removeListener('message', handleMessage);
                    if (message.type === 'metrics') {
                        resolve(message.metrics);
                    } else {
                        reject(new Error('Invalid message type from worker'));
                    }
                };

                worker.on('message', handleMessage);
                worker.send({'name':'getMetrics'});
            });
        });
    
        // Wait for all workers to respond
        const allMetrics = await Promise.all(metricsPromises);

        const singleRegistry = AggregatorRegistry.aggregate(allMetrics)
        const promString = await singleRegistry.metrics();

    // Send the aggregated metrics
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(promString);
} catch (err) {
    res.writeHead(500);
    res.end(err.message);
}
});

HTTPServer.listen(8080);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//count Cores CPU
let numberCores = os.cpus().length;
let listForks = [];

let cluster_config = {
    numWorkers: numberCores,
    refreshTime: 1000, // Milliseconds between data refreshes.
    worker: {
        maxpid: numberCores,
        port: 80,
        setNoDelay: true,
        pingInterval: 2000, // Pings to each client.
        samplingInterval: 10, // Event loop responsiveness sampling.
        gcInterval: 60 * 1000,
        pid: 0
    }
};

cluster.schedulingPolicy = cluster.SCHED_RR; //work mode

cluster.setupMaster({
    exec: __dirname + '/index.js'
});

for (let i = 0; i < cluster_config.numWorkers; i++) {
    cluster_config.worker.pid = i;
    listForks[i] = cluster.fork({WORKER_CONFIG: JSON.stringify(cluster_config.worker), FORCED: false});
}

cluster.on('message', (worker, message, handle) => {

    if (message['metrics']) {
        return
    }
    async.forEachOf(listForks, (fork_, key, cb) => {
        try {
            fork_.send(message, (e) => {});
        } catch (e) {
            listForks.splice(key, 1);
            console.log('send message error', e);
        }
        cb();
    }, (err) => {
    });
});
/////////////////////////////////////////// DEBUG worker ///////////////////////////////////////////////////////////////
cluster.on('exit', (worker, code, signal) => {
    console.error('worker %d died (%s). restarting...', worker.process.pid, signal, code);

    //cluster.fork();

    //Restart fork()
    if (signal !== 'SIGTERM') {
        cluster_config.worker.pid = worker.id;
        listForks.forEach((w, i) => {
            if (worker == w) {
                cluster_config.worker.pid = i;
            }
        })
        if (typeof worker.kill === 'function') {
            worker.kill();
        } else {
            console.log("can't kill worker", worker);
        }
        let newFork = cluster.fork({WORKER_CONFIG: JSON.stringify(cluster_config.worker), FORCED: true});

        listForks[cluster_config.worker.pid] = newFork;

        let fileNameLog = '/nodejs/temp/cluster_error.txt';

        let txtContent = new Date() + " on.exit: " + "worker.id:" + worker.id + 'pid: ' + worker.process.pid + '.  code: ' + code + '. signal: ' + signal + "\n";

        fs.appendFile(fileNameLog, txtContent, (err_write) => {
            if (err_write) console.error(err_write);
        });
    } else {
        console.log('Server stopped by mongodb error');
    }
});
