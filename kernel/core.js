const Utils         = require('./utils.js');
const Session       = require('./session.js');
const Package       = require('./package.js');
const User          = require('./user.js');
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
            core.stdout.push(`[${sessID}] Session logged as ${sess.user.login} \n`);
        });
        sess.on('disconnect',() => {
            core.stdout.push(`[${sessID}] Session deleted and disconnected from OS registery\n`);
            core.sessions.delete(sessID);
        });
        core.stdout.push(`[SYSTEM] Session created with id => ${sessID} \n`);
        core.sessions.set(sessID,sess);
        return sessID;
    },
    "setp": async (core,pkg) => {
        const prefix = pkg.data[0];
        if(prefix != undefined && typeof prefix === 'string') {
            core.setPrefix(prefix);
        }
        else {
            core.stdout.push('Invalid prefix!')
        }
        return true;
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

        this.usersRegistery = new Map();
        this.addUser(new User({
            user: "root",
            password: "root"
        }));

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

    setPrefix(strPrefix) {
        if(typeof strPrefix === 'string') {
            this.prefix = strPrefix;
        }
    }

    resetPrefix() {
        this.prefix = undefined;
    }

    addUser(user) {
        if(user instanceof User) {
            if(this.usersRegistery.has(user.login) === true) {
                this.stdout.push(`[SYSTEM] User ${user.login} already exist in the registry\n`);
                return;
            }
            this.usersRegistery.set(user.login,user);
        }
        else {
            this.stdout.push('Failed to add user. Invalid format\n');
        }
    }

    start() {
        if(this.started === true) return;
        if(this.TOReboot != undefined) {
            clearTimeout(this.TOReboot);
            this.TOReboot = undefined;
        }
        this.started = true;
    }

    stop() {
        if(this.started === false) return;
        this.sessions.forEach(sess => {
            sess.disconnect();
        });
        this.started = false;
    }

    reebot(timeMs = 5000) {
        this.stop();
        this.TOReboot = setTimeout(() => {
            this.TOReboot = undefined;
            this.start();
        },timeMs);
    }

    use(systemPackage) {
        if(systemPackage instanceof Package) {
            if(systemPackage.prefix != undefined) {
                var prefix = systemPackage.prefix; 
                if(SYSCMD.hasOwnProperty(prefix) === true) {
                    this.stdout.push("Package prefix "+prefix+" already in use!\n");
                    return;
                }
                SYSCMD[prefix] = {};
            }
            // Pipe package stream!
            systemPackage.stdout.pipe(this.stdout);
            systemPackage.commands.forEach( (asyncFN, cmdName) => {
                if(prefix != undefined) {
                    if(SYSCMD[prefix].hasOwnProperty(cmdName) === false) {
                        SYSCMD[prefix][cmdName] = asyncFN;
                    }
                }
                else {
                    if(SYSCMD.hasOwnProperty(cmdName) === false) {
                        SYSCMD[cmdName] = asyncFN;
                    }
                }
            });
        }
    }

    login(sessID,user,password) {
        return new Promise(async (resolve,reject) => {
            if(this.sessions.has(sessID) === false) {
                reject('[SYSTEM] Invalid sessionID');
                return;
            }
            if(this.usersRegistery.has(user) === false) {
                reject('[SYSTEM] invalid username');
                return;
            }
            const cUser = this.usersRegistery.get(user);
            if(cUser.isEqual(user,password) === false) {
                reject('[SYSTEM] Invalid user login or password!');
                return;
            }
            const sess = this.sessions.get(sessID);
            sess.connect({
                user: cUser
            });
            resolve(sess);
        });
    }

    send(pkg) {
        return new Promise(async (resolve,reject) => {
            if(this.started === false) {
                reject("OS Not started!");
                return;
            }

            this.stdout.push('[SYSTEM] Pkg received ');
            this.stdout.push(JSON.stringify(pkg)+'\n');
            this.stdout.push('--------------------\n');

            const defaultCommandName = this.prefix || pkg.event;
            if(SYSCMD.hasOwnProperty(defaultCommandName)) {
                try {
                    if(this.prefix != undefined && SYSCMD[this.prefix].hasOwnProperty(pkg.event)) {
                        var res = await SYSCMD[this.prefix][pkg.event](this,pkg);
                    }
                    else {
                        var res = await SYSCMD[pkg.event](this,pkg);
                    }
                    resolve(res);
                }
                catch(Err) {
                    reject(Err);
                }
            }
            else {
                this.stdout.push('[SYSTEM] Unknow system command '+eventPath[0]+'\n');
                reject('[SYSTEM] Unknow system command');
            }
        })
    }

}

module.exports = Core;