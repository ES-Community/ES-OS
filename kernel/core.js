const Utils     = require('./utils.js');
const Terminal  = require('./terminal.js');
const Readline  = require('readline');
const Emitter   = require('events');

const ICoreConstructor = {
    ip: "0.0.0.0"
}

class Core extends Emitter {

    constructor(config) {
        super();
        this.started = false;
        Object.assign(this,ICoreConstructor,config);

        this.sessions   = new Map();
        this.users      = new Map();
        this.users.set('root',{
            password: 'root',
            right: 777
        });
        this.tty = new Terminal();

        this.on('connection',async () => {
            const user      = await this.tty.getInput('user: ');
            const password  = await this.tty.getInput('password: ');
            /*if(this.users.has(user) === true) {
                if(this.users.get(user).password === password) {
                    console.log('connected!');
                }
            }*/
        });
    }

    registerUser(login,password) {
        this.users.set(login,{
            password,
            right: 777
        });
    }

    start() {
        if(this.started === true) return;
        this.started = true;
    }

    stop() {
        if(this.started === false) return;
        this.sessions.forEach(sess => {
            // sess.disconnect();
        });
        this.started = false;
    }

    send(pkg) {
        return new Promise((resolve,reject) => {
            if(this.started === false) {
                reject("OS Not started!");
            }

            console.log('Pkg received!');
            console.log(JSON.stringify(pkg,null,4));
            console.log('--------------------');
            if(pkg.event === 'connect') {
                this.emit('connection');
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