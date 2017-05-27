const Utils = require('./utils.js');
const Emitter = require('events');

/*
 * Interfaces
 */
const ISessionConnect = {
    right: 777,
    connected: true
}

class Session extends Emitter {
    
    constructor() {
        super();
        this.id = Utils.generateUUID();
        this.dt_created = Date.now();
        this.connected = false;
    }

    getSessionID() {
        return this.id;
    }

    connect(options) {
        if(options.user == undefined) {
            throw new Error("Please defined a user");
        }
        Object.assign(this,Utils.assignInterface(options,ISessionConnect));
        this.dt_connected = Date.now();
        this.emit('connected');
    }

    disconnect() {
        this.emit('disconnect');
    }

}

module.exports = Session;