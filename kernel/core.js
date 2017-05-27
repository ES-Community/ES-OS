const utils = require('./utils.js');
const emitter = require('events');

const ICoreConstructor = {
    ip: "0.0.0.0"
}

class Core extends emitter {

    constructor(config) {
        super();
        this.started = false;
        Object.assign(this,ICoreConstructor,config);
    }

    start() {
        if(this.started === true) return;
        this.started = true;
    }

    stop() {
        if(this.started === false) return;
        this.started = false;
    }

    send_package(pkg) {
        return new Promise((resolve,reject) => {
            if(this.started === false) {
                reject("OS Not started!");
            }

            console.log('Pkg received!');
            console.log(JSON.stringify(pkg,null,4));
            if(pkg.event === 'connect') {
                this.emit('connection')
                resolve(void 0);
            }
            else if(pkg.event === 'ping') {
                resolve(true);
            }
            else {
                reject('Unknow system event');
            }
        })
    }

}

module.exports = Core;