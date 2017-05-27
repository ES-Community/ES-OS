const Emitter = require('events');
const Readable = require('stream').Readable;

class Package extends Emitter {

    constructor() {
        super();
        this.stdout = new Readable(); 
        this.stdout._read = function() {
            // Nothing;
        }
        this.commands = new Map();
    }

}