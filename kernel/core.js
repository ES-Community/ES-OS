const Utils         = require('./utils.js');
const Session       = require('./session.js');
const Package       = require('./package.js');
const Readline      = require('readline');
const Emitter       = require('events');
const Readable      = require('stream').Readable;

/*
 * SYSCMD Commands!
 */
const SYSCMD = {
    "connect": async (core,pkg) => {
        core.stdout.push(`
******************************************************************\n
********               ES-OS Version 1.0.0                ********\n
******************************************************************\n
Kernel version : 1.0.0 \n
All right reserved ES-Community \n\n
        `);
        const sess      = new Session();
        const sessID    = sess.getSessionID();
        sess.on('connected',() => {
            core.stdout.push(`[${sessID}] Session logged! \n`);
        });
        sess.on('disconnect',() => {
            core.stdout.push(`[${sessID}] Session deleted and disconnected from OS registery\n`);
            core.sessions.delete(sessID);
        });
        core.stdout.push(`[SYSTEM] Session created with id => ${sessID} \n`);
        core.sessions.set(sessID,sess);
        return sessID;
    }
}

/*
 * Interfaces
 */
const ICoreConstructor = {
    ip: "0.0.0.0",
    sessionTimeOut: 5000,
    sessions: new Map(),
    stdout: new Readable(),
    started: false
}

class Core extends Emitter {

    constructor(config) {
        super();
        Object.assign(this,ICoreConstructor,config);
        this.stdout._read = function() {
            // Nothing!
        };

        this.usersRegistery = {
            "root": {
                password: "root"
            }
        };

        /* System health check! */
        setInterval(() => {
            this.sessions.forEach( sess => {
                if(sess.connected === false && Date.now() - sess.dt_created > this.sessionTimeOut) {
                    this.stdout.push('[SYSTEM] Session dropped\n');
                    sess.disconnect();
                }
            });
        },1000);
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
            sess.disconnect();
        });
        this.started = false;
    }

    use(systemPackage) {
        if(systemPackage instanceof Package) {
            // Pipe package stream!
            systemPackage.stdout.pipe(this.stdout);
            systemPackage.commands.forEach( (asyncFN, cmdName) => {
                if(SYSCMD.hasOwnProperty(cmdName) === false) {
                    SYSCMD[cmdName] = asyncFN;
                }
            });
        }
    }

    login(sessID,user,password) {
        return new Promise(async (resolve,reject) => {
            if(this.sessions.has(sessID) === false) {
                reject('[SYSTEM] Invalid sessionID');
            }
            if(this.usersRegistery.hasOwnProperty(user) === false) {
                reject('[SYSTEM] invalid username');
            }
            if(this.usersRegistery[user].password !== password) {
                reject('[SYSTEM] Invalid user password!');
            }
            const sess = this.sessions.get(sessID);
            sess.connect({
                user
            });
            resolve(sess);
        });
    }

    send(pkg) {
        return new Promise(async (resolve,reject) => {
            if(this.started === false) {
                reject("OS Not started!");
            }

            this.stdout.push('[SYSTEM] Pkg received ');
            this.stdout.push(JSON.stringify(pkg)+'\n');
            this.stdout.push('--------------------\n');

            if(SYSCMD.hasOwnProperty(pkg.event)) {
                try {
                    const res = await SYSCMD[pkg.event](this,pkg);
                    resolve(res);
                }
                catch(Err) {
                    reject(Err);
                }
            }
            else {
                reject('[SYSTEM] Unknow system command');
            }
        })
    }

}

module.exports = Core;