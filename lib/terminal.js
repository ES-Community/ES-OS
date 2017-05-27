'use strict';

const readline = require('readline');
const emitter = require('events');

class Terminal extends emitter {

    constructor() {
        super();
        console.log('Terminal is now open!');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.started = false;
    }

    pause() {
        this.started = false;
    }

    resume() {
        this.run();
    }

    async run() {
        this.started = true;
        const stdout = await this.askTTYInput();
        if(stdout[0] === '/') {
            const args  = stdout.split(' ');
            const cmd   = args.shift();
            await this.runCommand(cmd,...args);
        }
        else {
            console.log('Invalid command!');
        }
        if(this.started) this.run();
    }

    async runCommand(command,...args) {
        if(command === '/connect') {
            if(args[0] != undefined) {
                this.emit('network_package',{
                    event: 'connect',
                    destination: args[0]
                });
            }
            else {
                console.log('Please provide a IP!');
            }
        }
        else if(command === '/ping') {
            if(args[0] != undefined) {
                this.emit('network_package',{
                    event: 'ping',
                    destination: args[0]
                });
            }
            else {
                console.log('Please provide a IP!');
            }
        }
        else if(command === '/clear') {
            console.log('command clear triggered!');
            process.stdout.write('\x1Bc');
        }
    }

    askTTYInput() {
        return new Promise((resolve,reject) => {
            this.rl.question('Command:', (stdout) => {
                resolve(stdout);
            });
        });
    }

}   

module.exports = Terminal;