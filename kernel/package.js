const Emitter = require('events');
const Readable = require('stream').Readable;

class Package extends Emitter {

    constructor(prefix) {
        super();
        if(prefix != undefined && typeof prefix === 'string') {
            this.prefix = prefix;
        }
        this.stdout = new Readable(); 
        this.stdout._read = function() {
            // Nothing;
        }
        this.commands = new Map();
    }

}

module.exports = Package;