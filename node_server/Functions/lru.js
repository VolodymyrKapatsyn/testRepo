class Node {
    constructor(key, value, next = null, prev = null) {
        this.key = key;
        this.value = this.prepareMaxmindValue(value);
        this.next = next;
        this.prev = prev;
    }

    prepareMaxmindValue(tempMaxmindGeo) {
        let result = {location: {}, country: {}, registered_country: {}, city: { names: {}}, postal: {}, subdivisions: [{}]}

        if (tempMaxmindGeo['location']) {
            //lon
            if (tempMaxmindGeo['location']['longitude'] && tempMaxmindGeo['location']['longitude'] !== 'undefined') {
                result['location']['longitude'] = tempMaxmindGeo['location']['longitude'];
            }
            //lat
            if (tempMaxmindGeo['location']['latitude'] && tempMaxmindGeo['location']['latitude'] !== 'undefined') {
                result['location']['latitude'] = tempMaxmindGeo['location']['latitude'];
            }
            //metro
            if (tempMaxmindGeo['location']['metro_code'] && tempMaxmindGeo['location']['metro_code'] !== 'undefined') {
                result['location']['metro_code'] = tempMaxmindGeo['location']['metro_code'];
            }
            if (tempMaxmindGeo['location']['accuracy_radius'] && tempMaxmindGeo['location']['accuracy_radius'] !== 'undefined') {
                result['location']['accuracy_radius'] = tempMaxmindGeo['location']['accuracy_radius'];
            }
        }
        //country
        if (tempMaxmindGeo['country'] && tempMaxmindGeo['country']['iso_code'] && tempMaxmindGeo['country']['iso_code'] !== 'undefined') {
            result['country']['iso_code'] = tempMaxmindGeo['country']['iso_code'];
        } else if (tempMaxmindGeo['registered_country'] && tempMaxmindGeo['registered_country']['iso_code'] && tempMaxmindGeo['registered_country']['iso_code'] !== 'undefined') {
            result['registered_country']['iso_code'] = tempMaxmindGeo['registered_country']['iso_code'];
        }
        //city
        if (tempMaxmindGeo['city'] && tempMaxmindGeo['city']['names']['en'] && tempMaxmindGeo['city']['names']['en'] !== 'undefined') {
            result['city']['names']['en'] = tempMaxmindGeo['city']['names']['en'];
        }
        if (tempMaxmindGeo['city'] && tempMaxmindGeo['city']['geoname_id']) {
            result['city']['geoname_id'] = tempMaxmindGeo['city']['geoname_id'];
        }
        //zip
        if (tempMaxmindGeo['postal'] && tempMaxmindGeo['postal']['code'] && tempMaxmindGeo['postal']['code'] !== 'undefined') {
            result['postal']['code'] = tempMaxmindGeo['postal']['code'];
        }
        //region
        if (tempMaxmindGeo['subdivisions'] && (tempMaxmindGeo['subdivisions'].length > 0) && tempMaxmindGeo['subdivisions'][0]['iso_code'] &&
            tempMaxmindGeo['subdivisions'][0]['iso_code'] !== 'undefined'
        ) {
            result['subdivisions'][0]['iso_code'] = tempMaxmindGeo['subdivisions'][0]['iso_code'];
        }

        return result
    }
}

class LRU {
    //set default limit of 10 if limit is not passed.
    constructor(limit = 10) {
        this.size = 0;
        this.limit = limit;
        this.head = null;
        this.tail = null;
        this.cacheMap = {};
    }

    write(key, value) {
        const existingNode = this.cacheMap[key];
        if (existingNode) {
            this.detach(existingNode);
            this.size--;
        } else if (this.size === this.limit) {
            delete this.cacheMap[this.tail.key];
            this.detach(this.tail);
            this.size--;
        }

        // Write to head of LinkedList
        if (!this.head) {
            this.head = this.tail = new Node(key, value);
        } else {
            const node = new Node(key, value, this.head);
            this.head.prev = node;
            this.head = node;
        }

        // update cacheMap with LinkedList key and Node reference
        this.cacheMap[key] = this.head;
        this.size++;
    }

    read(key) {
        const existingNode = this.cacheMap[key];
        if (existingNode) {
            const value = existingNode.value;
            // Make the node as new Head of LinkedList if not already
            if (this.head !== existingNode) {
                // write will automatically remove the node from it's position and make it a new head i.e most used
                this.write(key, value);
            }
            return value;
        }

        return  false
    }

    detach(node) {
        if (node.prev !== null) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }

        if (node.next !== null) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
    }

    clear() {
        this.head = null;
        this.tail = null;
        this.size = 0;
        this.cacheMap = {};
    }

    // Invokes the callback function with every node of the chain and the index of the node.
    forEach(fn) {
        let node = this.head;
        let counter = 0;
        while (node) {
            fn(node, counter);
            node = node.next;
            counter++;
        }
    }

    // To iterate over LRU with a 'for...of' loop
    *[Symbol.iterator]() {
        let node = this.head;
        while (node) {
            yield node;
            node = node.next;
        }
    }
}

module.exports = LRU