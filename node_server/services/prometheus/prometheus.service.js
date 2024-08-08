const customMetrics = {}
const { Counter, Registry } = require('prom-client');
const register = new Registry();
class PrometheusService {
    static PromInstance
    static testProperty = 5

    static getInstance() {
        if(!PrometheusService.PromInstance) {
            PrometheusService.PromInstance = new PrometheusService()
        }

        return this.PromInstance
    }

    async inc(key, labels = {}) {

        let calculatedKey = `${key}`
        calculatedKey = calculatedKey.replace(/-/g, '_')
        calculatedKey = calculatedKey.replace(/\[/g, '')
        calculatedKey = calculatedKey.replace(/\]/g, '')
        calculatedKey = calculatedKey.replace(/ /g, '_')
        calculatedKey = calculatedKey.replace(/\./g, '_')
        try {
            if (!customMetrics[calculatedKey]) {
                customMetrics[calculatedKey] = new Counter({
                    name: calculatedKey,
                    help: calculatedKey,
                    labelNames: Object.keys(labels)
                })
                register.registerMetric(customMetrics[calculatedKey])
            }
        } catch (error) {

            console.error('prometheus counter error' + calculatedKey)
            console.error(error.message)
        }

        if (customMetrics[calculatedKey]) {
            customMetrics[calculatedKey].labels(labels).inc()
        }

    }
}

module.exports = {
    PrometheusService,
    Prometheus_register: register
}
